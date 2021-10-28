using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Models;
using Cerebro_Utilities.Models;
using static Cerebro_Utilities.Utilities.QueryHelper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface IRuleDao
    {
        public void RetrieveKeywordsAndSchemeIcons();
        public List<RuleEntity> RetrieveByTerm(string term);
    }

    public class RuleDao : IRuleDao
    {
        private SearchClient _searchClient;

        public static List<RuleEntity> _keywordsAndSchemeIcons;

        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public RuleDao(IConfigurationRoot configuration, ILogger<IRuleDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            _searchClient = new SearchIndexClient(new Uri(_configuration.GetValue<string>(Constants.INDEX_URI), UriKind.Absolute), new AzureKeyCredential(_configuration.GetValue<string>(Constants.API_KEY)))
                .GetSearchClient(RuleEntity.INDEX_NAME);

            RetrieveKeywordsAndSchemeIcons();
        }

        public void RetrieveKeywordsAndSchemeIcons()
        {
            _keywordsAndSchemeIcons = new List<RuleEntity>();

            SearchOptions options = new SearchOptions
            {
                Filter = "PartitionKey eq 'Keyword' or PartitionKey eq 'Scheme Icon'"
            };

            Response<SearchResults<RuleEntity>> response = _searchClient.Search<RuleEntity>("*", options);
            List<RuleEntity> keywords = response.Value?.GetResults()
                .Select(x => x.Document)
                .ToList();

            foreach (RuleEntity keyword in keywords)
            {
                _keywordsAndSchemeIcons.Add(keyword);
            }

            _logger.LogInformation($"Loaded {_keywordsAndSchemeIcons.Count} keywords from the database!");
        }

        public List<RuleEntity> RetrieveByTerm(string term)
        {
            return RetrieveByTerm(term, FlagNames.Bare);
        }

        private List<RuleEntity> RetrieveByTerm(string term, FlagNames flag)
        {
            term = term.ToLower();

            SearchOptions options = new SearchOptions
            {
                QueryType = SearchQueryType.Full,
                SearchFields = { "Title", "Terms" },
                SearchMode = SearchMode.All
            };

            string query;

            if (flag == FlagNames.Wildcard)
            {
                query = BuildWildcardQuery(term);
            }
            else if (flag == FlagNames.Fuzzy)
            {
                query = $"{EscapeQuery(term)}~";
            }
            else
            {
                query = EscapeQuery(term);
            }

            Response<SearchResults<RuleEntity>> response = _searchClient.Search<RuleEntity>(query, options);
            List<RuleEntity> rules = response.Value?.GetResults()
                .Select(x => x.Document)
                .ToList();

            if (rules.Count > 0)
            {
                List<RuleEntity> matches = rules.FindAll(x => x.Title.ToLower() == term || x.RowKey.ToLower() == term);

                if (matches.Count == 0)
                {
                    matches = rules.FindAll(x => x.Terms.ToLower().Contains(term));
                }

                return matches.Count > 0 ? matches : rules;
            }
            else
            {
                if (flag == FlagNames.Bare)
                {
                    return RetrieveByTerm(term, FlagNames.Wildcard);
                }
                else if (flag == FlagNames.Wildcard)
                {
                    return RetrieveByTerm(term, FlagNames.Fuzzy);
                }
                else
                {
                    return null;
                }
            }
        }
    }
}
