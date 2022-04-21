const { ALL, OFFICIAL } = require('../constants');
const { PackEntity } = require('../models/packEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class PackDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(PackEntity.DATABASE_SUFFIX)).initialize();

    static PACKS = [];

    static async RetrieveAllPacks() {
        console.log(`Starting to load packs from the database...`);
        
        this.PACKS = [];

        let documents = await this.store.openSession().query({ indexName: `${ALL}${PackEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.PACKS.push(new PackEntity(document));
        }

        console.log(` - Found ${this.PACKS.filter(x => x.Official).length} official packs in the database...`);
        console.log(` - Found ${this.PACKS.filter(x => !x.Official).length} unofficial packs in the database...`);
        console.log(`Loaded ${this.PACKS.length} total packs from the database!\n`);
    }

    static RetrieveByNameLocally(terms, origin = ALL) {
        let results = this.PACKS.filter(x => x.Name.toLowerCase().includes(terms.toLowerCase()));

        if (origin !== ALL) {
            let official = origin === OFFICIAL;
            results = results.filter(x => x.Official === official);
        }

        return results;
    }

    static async RetrieveWithFilters(origin = ALL, id = null, name = null) {
        const session = this.store.openSession();
        let query = session.query({ indexName: `${ALL}${PackEntity.COLLECTION}` });
        
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
            results.push(new PackEntity(document));
        }

        return results;
    }
}

module.exports = { PackDao }