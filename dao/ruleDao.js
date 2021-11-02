const { SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const { RuleEntity } = require('../models/ruleEntity');
const { BuildWildcardQuery, EscapeQuery, FlagNames } = require('../utilities/queryHelper');

class RuleDao {
    constructor() { }
    
    static searchClient = new SearchIndexClient(process.env.searchUri, new AzureKeyCredential(process.env.apiKey)).getSearchClient(RuleEntity.INDEX_NAME);
    static KEYWORDS_AND_ICONS = [];

    static async RetrieveKeywordsAndSchemeIcons()
    {
        this.KEYWORDS_AND_ICONS = [];

        var searchOptions = {
            filter: `PartitionKey eq 'Keyword' or PartitionKey eq 'Scheme Icon'`
        };
        
        var searchResults = await this.searchClient.search('*', searchOptions);

        for await (const result of searchResults.results) {
            this.KEYWORDS_AND_ICONS.push(new RuleEntity(result.document));
        }
    
        if (this.KEYWORDS_AND_ICONS.length > 0) {
            console.log(`Loaded ${this.KEYWORDS_AND_ICONS.length} keywords and scheme icons from the database!`);
        }
        else {
            console.log(`Unable to load keywords and scheme icons from the database...`);
        }
    }
    
    static async RetrieveByTerm(terms, flag = FlagNames.BARE) {
        terms = terms.toLowerCase();

        var searchOptions = {
            queryType: 'full',
            searchFields: ['Terms, Title'],
            searchMode: 'all'
        };

        var query;

        switch(flag) {
            case FlagNames.WILDCARD:
                query = BuildWildcardQuery(terms);
                break;
            case FlagNames.FUZZY:
                query = `${EscapeQuery(terms)}~`;
                break;
            default:
                query = EscapeQuery(terms);
        }
        
        var searchResults = await this.searchClient.search(query, searchOptions);
        
        var results = [];

        var results = [];

        for await (const result of searchResults.results) {
            results.push(new RuleEntity(result.document));
        }

        if (results.length > 0) {
            var matches = results.filter(function(rule) {
                return rule.Title.toLowerCase() === terms || rule.Id.toLowerCase() === terms;
            });

            return matches.length > 0 ? matches : results;
        }
        else {
            if (flag === FlagNames.FUZZY) {
                return null;
            }
            else {
                var nextFlag = flag === FlagNames.BARE ? FlagNames.WILDCARD : FlagNames.FUZZY;

                return this.RetrieveByTerm(terms, nextFlag);
            }
        }
    };
};

module.exports = { RuleDao };