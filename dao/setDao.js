const { ALL, OFFICIAL } = require('../constants');
const { SetEntity } = require('../models/setEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class SetDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(SetEntity.DATABASE_SUFFIX)).initialize();

    static SETS = [];

    static async RetrieveAllSets() {
        console.log(`Starting to load sets from the database...`);
        
        this.SETS = [];

        let documents = await this.store.openSession().query({ indexName: `${ALL}${SetEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.SETS.push(new SetEntity(document));
        }

        console.log(` - Found ${this.SETS.filter(x => x.Official).length} official sets in the database...`);
        console.log(` - Found ${this.SETS.filter(x => !x.Official).length} unofficial sets in the database...`);
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

    static async RetrieveByNameRemotely(terms, origin = ALL) {
        const session = this.store.openSession();

        let index = `${ALL}${SetEntity.COLLECTION}`;

        let query = session.query({ indexName: index })
            .whereRegex('Name', terms.toLowerCase());

        if (origin !== ALL) {
            let official = origin === OFFICIAL;
            
            query = query.andAlso()
                .whereEquals('Official', official);
        }

        let documents = await query.all();

        if (documents.length > 0) {
            let results = [];

            for (let document of documents) {
                results.push(new SetEntity(document));
            }
            
            return results;
        }
        else {
            return [];
        }
    }
}

module.exports = { SetDao }