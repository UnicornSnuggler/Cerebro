const { SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { PrintingEntity } = require('../models/printingEntity');

class PrintingDao {
    constructor() { }
    
    static searchClient = new SearchIndexClient(process.env.searchUri, new AzureKeyCredential(process.env.apiKey)).getSearchClient(PrintingEntity.INDEX_NAME);
    
    static async RetrieveByCard(card) {
        var searchOptions = {
            filter: `ArtificialId eq '${card.Id}'`
        };
        
        var searchResults = await this.searchClient.search('*', searchOptions);
        
        var results = [];
        
        for await (const result of searchResults.results) {
            var printing = new PrintingEntity(result.document);

            printing.Pack = PackDao.PACKS.find(pack => pack.Id === printing.PackId);
            printing.Set = SetDao.SETS.find(set => set.Name === printing.SetName);

            results.push(printing);
        }

        return results;
    };
};

module.exports = { PrintingDao };