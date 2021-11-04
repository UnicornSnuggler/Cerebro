const { PackEntity } = require('../models/packEntity');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

class PackDao {
    constructor() { }

    static store = CreateDocumentStore(PackEntity.DATABASE).initialize();

    static PACKS = [];

    static async RetrieveAllPacks() {
        console.log(`Starting to load packs from the database...`);
        
        this.PACKS = [];

        for (var index of PackEntity.INDEXES) {
            var documents = await this.store.openSession().query({ indexName: index }).all();
    
            for (var document of documents) {
                this.PACKS.push(new PackEntity(document));
            }

            console.log(` - Found ${documents.length} packs from index '${index}'...`);
        }

        console.log(`Loaded ${this.PACKS.length} total packs from the database!\n`);
    }
}

module.exports = { PackDao }