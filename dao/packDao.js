const { PackEntity } = require('../models/packEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class PackDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(PackEntity.DATABASE_SUFFIX)).initialize();

    static PACKS = [];

    static async RetrieveAllPacks() {
        console.log(`Starting to load packs from the database...`);
        
        this.PACKS = [];

        let documents = await this.store.openSession().query({ indexName: `all${PackEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.PACKS.push(new PackEntity(document));
        }

        console.log(` - Found ${this.PACKS.filter(x => x.Official).length} official packs in the database...`);
        console.log(` - Found ${this.PACKS.filter(x => !x.Official).length} unofficial packs in the database...`);
        console.log(`Loaded ${this.PACKS.length} total packs from the database!\n`);
    }
}

module.exports = { PackDao }