﻿using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Models;
using Azure;
using Azure.Search.Documents;
using Cerebro_Utilities.Extensions;
using Cerebro_Utilities.Models;
using static Cerebro_Utilities.Utilities.QueryHelper;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Cerebro_Utilities.Dao
{
    public interface ICardDao
    {
        List<CardEntity> FindFaces(string cardId);
        List<CardEntity> FindGroup(string groupId);
        List<CardEntity> RetrieveByName(string cardName);
    }

    public class CardDao : ICardDao
    {
        private SearchClient _searchClient;

        private IPrintingDao _printingDao;

        private readonly IConfigurationRoot _configuration;

        public CardDao(IConfigurationRoot configuration, IPrintingDao printingDao)
        {
            _configuration = configuration;

            _searchClient = new SearchIndexClient(new Uri(_configuration.GetValue<string>(Constants.INDEX_URI), UriKind.Absolute), new AzureKeyCredential(_configuration.GetValue<string>(Constants.API_KEY)))
                .GetSearchClient(CardEntity.INDEX_NAME);

            _printingDao = printingDao;
        }

        public List<CardEntity> FindFaces(string cardId)
        {
            if (cardId.Length > Constants.ID_LENGTH)
            {
                string baseId = cardId.Substring(0, Constants.ID_LENGTH);

                SearchOptions options = new SearchOptions
                {
                    QueryType = SearchQueryType.Full,
                    SearchFields = { "RowKey" },
                    SearchMode = SearchMode.All
                };

                Response<SearchResults<CardEntity>> response = _searchClient.Search<CardEntity>($"{baseId}*", options);
                List<CardEntity> cards = response.Value?.GetResults()
                    .Select(x => x.Document)
                    .ToList();

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

                    return GetPrintings(cards);
                }
            }
            else
            {
                return null;
            }
        }

        public List<CardEntity> FindGroup(string groupId)
        {
            if (groupId != null)
            {
                SearchOptions options = new SearchOptions
                {
                    QueryType = SearchQueryType.Full,
                    SearchFields = { "Group" },
                    SearchMode = SearchMode.All
                };

                Response<SearchResults<CardEntity>> response = _searchClient.Search<CardEntity>($"{groupId}", options);
                List<CardEntity> cards = response.Value?.GetResults()
                    .Select(x => x.Document)
                    .ToList();

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

                    return GetPrintings(cards);
                }
            }
            else
            {
                return null;
            }
        }

        private List<CardEntity> GetPrintings(List<CardEntity> cards)
        {
            List<CardEntity> results = new List<CardEntity>();

            foreach (CardEntity card in cards)
            {
                card.Printings = _printingDao.GetPrintings(card.RowKey);

                results.Add(card);
            }

            return results;
        }

        public List<CardEntity> RetrieveByName(string name)
        {
            FlagNames flag = name.Contains("*") ? FlagNames.Wildcard : FlagNames.Bare;

            return RetrieveByName(name, flag);
        }

        private List<CardEntity> RetrieveByName(string name, FlagNames flag)
        {
            name = name.ToLower();

            SearchOptions options = new SearchOptions
            {
                QueryType = SearchQueryType.Full,
                SearchFields = { "Name", "Subname" },
                SearchMode = SearchMode.All
            };

            string query;

            if (flag == FlagNames.Wildcard)
            {
                query = BuildWildcardQuery(name);
            }
            else if (flag == FlagNames.Fuzzy)
            {
                query = $"{EscapeQuery(name)}~";
            }
            else
            {
                query = EscapeQuery(name);
            }

            Response<SearchResults<CardEntity>> response = _searchClient.Search<CardEntity>(query, options);
            List<CardEntity> cards = response.Value?.GetResults()
                .Select(x => x.Document)
                .ToList();

            if (cards.Count > 0)
            {
                List<CardEntity> matches = cards.FindAll(x => x.Name.ToLower() == name || (x.Subname != null && x.Subname.ToLower() == name));
                
                return GetPrintings(TrimDuplicates(matches.Count > 0 ? matches : cards));
            }
            else
            {
                if (flag == FlagNames.Bare)
                {
                    return RetrieveByName(name, FlagNames.Wildcard);
                }
                else if (flag == FlagNames.Wildcard)
                {
                    return RetrieveByName(name, FlagNames.Fuzzy);
                }
                else
                {
                    return null;
                }
            }
        }

        private List<CardEntity> TrimDuplicates(List<CardEntity> cards)
        {
            List<CardEntity> results = new List<CardEntity>();

            foreach (CardEntity card in cards)
            {
                if (results.Find(x => x.IsFaceOf(card) || x.IsGroupedWith(card)) == null)
                {
                    results.Add(card);
                }
            }

            return results;
        }
    }
}
