using Azure.Storage.Blobs;
using Cerebro.Extensions;
using Cerebro.Models;
using DSharpPlus;
using FuzzySharp;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Cerebro.Dao
{
    public interface ICerebroDao
    {
        List<string> FindArtStyles(CardEntity card);
        List<CardEntity> FindFaces(CardEntity card);
        List<CardEntity> FindStages(CardEntity card);
        string ParseArtificialId(PrintingEntity printing);
        CardEntity Retrieve(string packName, string cardId);
        List<CardEntity> RetrieveByName(string cardName);
        void UpdateCardList();
    }

    public class CerebroDao : ICerebroDao
    {
        private BlobServiceClient _blobClient;
        private CloudStorageAccount _storageAccount;

        private List<CardEntity> _cards;
        public static List<FormattingEntity> _formattings;
        private List<string> _images;
        private List<PackEntity> _packs;
        private List<PrintingEntity> _printings;
        private List<SetEntity> _sets;
        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public CerebroDao(IConfigurationRoot configuration, ILogger<ICerebroDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _storageAccount = CloudStorageAccount.Parse(connectionString);
            _blobClient = new BlobServiceClient(connectionString);

            UpdateCardList();
        }

        public List<string> FindArtStyles(CardEntity card)
        {
            List<string> results = new List<string>()
            {
                $"{Constants.IMAGE_PREFIX}{card.RowKey}.png"
            };

            List<PrintingEntity> reprints = card.GetReprints();

            if (reprints != null)
            {
                foreach (PrintingEntity printing in reprints)
                {
                    string fileName = $"{printing.RowKey}.png";
                    int index = _images.IndexOf(fileName);

                    if (index != -1)
                    {
                        results.Add($"{Constants.IMAGE_PREFIX}{fileName}");
                    }
                }

                if (results.Count > 1)
                {
                    return results;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        }

        public List<CardEntity> FindFaces(CardEntity card)
        {
            if (card.RowKey.Length > Constants.ID_LENGTH)
            {
                var cards = _cards.FindAll(x => x.IsRelatedTo(card) || x == card);

                if (cards.Count() == 0)
                {
                    return null;
                }
                else
                {
                    cards.Sort(delegate (CardEntity a, CardEntity b)
                    {
                        return a.RowKey.CompareTo(b.RowKey);
                    });

                    return cards;
                }
            }
            else
            {
                return null;
            }
        }

        public List<CardEntity> FindStages(CardEntity card)
        {
            if (card.Stage != null)
            {
                _cards.Sort(delegate (CardEntity x, CardEntity y)
                { 
                    return x.RowKey.CompareTo(y.RowKey);
                });

                List<CardEntity> stages = new List<CardEntity>();

                int first = _cards.IndexOf(card);

                while (_cards[first - 1].Type == card.Type)
                {
                    first--;
                }

                int last = _cards.IndexOf(card);

                while (_cards[last + 1].Type == card.Type)
                {
                    last++;
                }

                stages = _cards.GetRange(first, last - first + 1);

                if (stages.Count > 1)
                {
                    stages.Sort(delegate (CardEntity x, CardEntity y)
                    {
                        return x.RowKey.CompareTo(y.RowKey);
                    });

                    return stages;
                }
                else
                {
                    return null;
                }
            }
            else
            { 
                return null;
            }
        }

        public string ParseArtificialId(PrintingEntity printing)
        {
            string setNumber = _sets[_sets.FindIndex(x => x.RowKey == printing.PartitionKey)].Number;

            return $"{setNumber}{printing.SetNumber.PadLeft(3, '0')}";
        }

        public CardEntity Retrieve(string packName, string cardId)
        {
            try
            {
                var card = _cards.Find(x => x.PartitionKey.Equals(packName) && x.RowKey.Equals(cardId));

                if (card != null)
                {
                    return card;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public List<CardEntity> RetrieveByName(string cardName)
        {
            var results = _cards.FindAll(x => x.Name.ToLower().Equals(cardName.ToLower()));
            results.AddRange(_cards.FindAll(x => x.Subname != null && x.Subname.ToLower().Equals(cardName.ToLower()) && results.FindAll(y => y.IsRelatedTo(x)).Count == 0));

            if (results.Count() == 0)
            {
                results.AddRange(_cards.FindAll(x => x.RowKey.ToLower().Equals(cardName.ToLower())));
            }

            if (results.Count() == 0)
            {
                results.AddRange(_cards.FindAll(x => x.Printings.Exists(y => y.RowKey.ToLower().Equals(cardName.ToLower()))));
            }

            if (results.Count() == 0)
            {
                results = _cards.FindAll(x => Fuzz.Ratio(x.Name.ToLower(), cardName.ToLower()) > 65);
            }

            if (results.Count() == 0)
            {
                return null;
            }
            else
            {
                if (results.Count() > 1)
                {
                    results.Sort(delegate (CardEntity x, CardEntity y)
                    {
                        return Fuzz.Ratio(y.Name.ToLower(), cardName.ToLower()).CompareTo(Fuzz.Ratio(x.Name.ToLower(), cardName.ToLower()));
                    });
                }

                return TrimDuplicates(results);
            }
        }

        private List<CardEntity> TrimDuplicates(List<CardEntity> cards)
        {
            List<CardEntity> results = new List<CardEntity>();

            foreach (CardEntity card in cards)
            {
                if (results.Find(x => x.IsRelatedTo(card)) == null) {
                    List<CardEntity> stages = FindStages(card);

                    if (stages == null || results.Find(x => stages.Contains(x)) == null)
                    {
                        results.Add(card);
                    }
                }
            }

            return results;
        }

        public void UpdateCardList()
        {
            UpdateFormattingList();
            UpdateImageList();
            UpdatePackList();
            UpdatePrintingList();
            UpdateSetList();

            _cards = new List<CardEntity>();

            try
            {
                var cardTable = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(CardEntity.TABLE_NAME);

                IQueryable<CardEntity> entities = cardTable.CreateQuery<CardEntity>()
                    .Select(x => x);

                foreach (var card in entities)
                {
                    List<PrintingEntity> printings = _printings.FindAll(x => x.ArtificialId.Equals(card.RowKey));

                    if (printings.Count > 0)
                    {
                        card.Printings = printings;

                        _cards.Add(card);
                    }
                    else
                    {
                        _logger.LogError($"No printings were found for {card.RowKey}.  Accordingly, the card will be skipped.");
                    }
                }

                _logger.LogInformation($"Loaded {_cards.Count} cards from the database!");
            }
            catch(Exception e)
            {
                _logger.LogError($"Exception caught while updating the card list...\n\n{e}");
            }
        }

        public void UpdateFormattingList()
        {
            _formattings = new List<FormattingEntity>();

            try
            {
                var formattingTable = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(FormattingEntity.TABLE_NAME);

                IQueryable<FormattingEntity> formattings = formattingTable.CreateQuery<FormattingEntity>()
                    .Select(x => x);

                foreach (FormattingEntity formatting in formattings)
                {
                    _formattings.Add(formatting);
                }

                _logger.LogInformation($"Loaded {_formattings.Count} formattings from the database!");
            }
            catch (Exception e)
            {
                _logger.LogError($"Exception caught while updating the formatting list...\n\n{e}");
            }
        }

        public void UpdateImageList()
        {
            _images = new List<string>();

            try
            {
                BlobContainerClient container = _blobClient.GetBlobContainerClient("cerebro-images");

                var blobs = container.GetBlobs();

                foreach (var image in blobs)
                {
                    _images.Add(image.Name);
                }

                _logger.LogInformation($"Loaded {_images.Count()} images from the database!");
            }
            catch (Exception e)
            {
                _logger.LogError($"Exception caught while updating the image list...\n\n{e}");
            }
        }

        public void UpdatePackList()
        {
            _packs = new List<PackEntity>();

            try
            {
                var packTable = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(PackEntity.TABLE_NAME);

                IQueryable<PackEntity> packs = packTable.CreateQuery<PackEntity>()
                    .Select(x => x);

                foreach (PackEntity pack in packs)
                {
                    _packs.Add(pack);
                }

                _logger.LogInformation($"Loaded {_packs.Count} packs from the database!");
            }
            catch (Exception e)
            {
                _logger.LogError($"Exception caught while updating the pack list...\n\n{e}");
            }
        }

        public void UpdatePrintingList()
        {
            _printings = new List<PrintingEntity>();

            try
            {
                var printingTable = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(PrintingEntity.TABLE_NAME);

                IQueryable<PrintingEntity> printings = printingTable.CreateQuery<PrintingEntity>()
                    .Select(x => x);

                foreach (PrintingEntity printing in printings)
                {
                    if (printing.PackName != null)
                    {
                        printing.Pack = _packs.Find(x => x.Id == printing.PackName);
                    }

                    _printings.Add(printing);
                }

                _logger.LogInformation($"Loaded {_printings.Count} printings from the database!");
            }
            catch (Exception e)
            {
                _logger.LogError($"Exception caught while updating the printing list...\n\n{e}");
            }
        }

        public void UpdateSetList()
        {
            _sets = new List<SetEntity>();

            try
            {
                var setTable = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(SetEntity.TABLE_NAME);

                IQueryable<SetEntity> sets = setTable.CreateQuery<SetEntity>()
                    .Select(x => x);

                foreach (SetEntity set in sets)
                {
                    _sets.Add(set);
                }

                _logger.LogInformation($"Loaded {_sets.Count} sets from the database!");
            }
            catch (Exception e)
            {
                _logger.LogError($"Exception caught while updating the set list...\n\n{e}");
            }
        }
    }
}
