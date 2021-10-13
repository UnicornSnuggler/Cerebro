using Azure.Storage.Blobs;
using Cerebro.Extensions;
using Cerebro.Models;
using FuzzySharp;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro.Dao
{
    public interface ICardDao
    {
        List<string> FindAlternateArt(CardEntity card);
        List<CardEntity> FindRelatedCards(CardEntity card);
        string ParseArtificialId(PrintingEntity printing);
        CardEntity Retrieve(string packName, string cardId);
        List<CardEntity> RetrieveByName(string cardName);
        void UpdateCardList();
    }

    public class CardDao : ICardDao
    {
        private BlobServiceClient _blobClient;
        private CloudStorageAccount _storageAccount;

        private List<CardEntity> _cards;
        private List<string> _images;
        private List<PrintingEntity> _printings;
        private List<SetEntity> _sets;
        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public CardDao(IConfigurationRoot configuration, ILogger<ICardDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _storageAccount = CloudStorageAccount.Parse(connectionString);
            _blobClient = new BlobServiceClient(connectionString);

            UpdateCardList();
        }

        public List<string> FindAlternateArt(CardEntity card)
        {
            List<string> results = new List<string>();
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

                if (results.Count > 0)
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

        public List<CardEntity> FindRelatedCards(CardEntity card)
        {
            if (card.RowKey.Length > Constants.ID_LENGTH)
            {
                var cards = _cards.FindAll(x => x.IsRelatedTo(card));

                if (cards.Count() == 0)
                {
                    return null;
                }
                else
                {
                    return cards;
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

                return results.Distinct().ToList();
            }
        }

        public void UpdateCardList()
        {
            UpdateImageList();
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

                Console.WriteLine($"Loaded {_sets.Count} sets from the database!");
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Exception caught while updating the set list...\n\n{e}");
            }
        }
    }
}
