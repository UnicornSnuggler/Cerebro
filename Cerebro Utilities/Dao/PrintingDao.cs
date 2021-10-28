using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Models;
using Cerebro_Utilities.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface IPrintingDao
    {
        List<PrintingEntity> GetPrintings(string cardId);
    }

    public class PrintingDao : IPrintingDao
    {
        private SearchClient _searchClient;

        private readonly IConfigurationRoot _configuration;

        public PrintingDao(IConfigurationRoot configuration)
        {
            _configuration = configuration;

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _searchClient = new SearchIndexClient(new Uri(_configuration.GetValue<string>(Constants.INDEX_URI), UriKind.Absolute), new AzureKeyCredential(_configuration.GetValue<string>(Constants.API_KEY)))
                .GetSearchClient(PrintingEntity.INDEX_NAME);
        }

        public List<PrintingEntity> GetPrintings(string cardId)
        {
            SearchOptions options = new SearchOptions
            {
                QueryType = SearchQueryType.Full,
                SearchFields = { "ArtificialId" },
                SearchMode = SearchMode.All
            };

            Response<SearchResults<PrintingEntity>> response = _searchClient.Search<PrintingEntity>($"{cardId}*", options);
            List<PrintingEntity> entities = response.Value?.GetResults()
                .Select(x => x.Document)
                .ToList();

            List<PrintingEntity> printings = new List<PrintingEntity>();

            foreach(PrintingEntity printing in entities)
            {
                printing.Pack = PackDao._packs.Find(x => x.RowKey == printing.PackId);
                printing.Set = SetDao._sets.Find(x => x.RowKey == printing.PartitionKey);

                printings.Add(printing);
            }

            return printings;
        }
    }
}
