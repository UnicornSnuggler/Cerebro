const { ALL, OFFICIAL } = require('../constants');
const { SetEntity } = require('../models/setEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class SetDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(SetEntity.DATABASE_SUFFIX)).initialize();

    static SETS = [];
    static CAMPAIGN_SET_IDS = [];

    static async RetrieveAllSets() {
        console.log(`Starting to load sets from the database...`);
        
        this.SETS = [];

        let documents = await this.store.openSession().query({ indexName: `${ALL}${SetEntity.COLLECTION}` }).all();

        for (let document of documents) {      
            let set = new SetEntity(document);
            this.SETS.push(set);

            if (set.Type === 'Campaign Set') {
                this.CAMPAIGN_SET_IDS.push(set.Id);
            }
        }

        console.log(` - Found ${this.SETS.filter(x => x.Official).length} official sets in the database...`);
        console.log(` - Found ${this.SETS.filter(x => !x.Official).length} unofficial sets in the database...`);
        console.log(` - Discovered ${this.CAMPAIGN_SET_IDS.length} campaign sets among the results...`);
        console.log(`Loaded ${this.SETS.length} total sets from the database!\n`);
    }

    static RetrieveByNameLocally(terms, origin = ALL) {
        let results = this.SETS.filter(x => x.Name.toLowerCase().includes(terms.toLowerCase()));

        if (origin !== ALL) {
            let official = origin === OFFICIAL;
            results = results.filter(x => x.Official === official);
        }

        return results;
    }

    static async RetrieveWithFilters(origin = ALL, id = null, name = null) {
        const session = this.store.openSession();
        let query = session.query({ indexName: `${ALL}${SetEntity.COLLECTION}` });
        
        let results = [];

        if (origin !== ALL) {            
            query = query.whereEquals('Official', origin === OFFICIAL);
        }
        
        if (id) {
            query = query.openSubclause()
                .whereRegex('id()', id)
                .closeSubclause();
        }

        if (name) {
            query = query.openSubclause()
                .whereRegex('Name', name)
                .closeSubclause();
        }

        let documents = await query.all();

        for (let document of documents) {
            results.push(new SetEntity(document));
        }

        return results;
    }
}

module.exports = { SetDao }