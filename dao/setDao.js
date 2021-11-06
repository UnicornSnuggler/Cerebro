const { SetEntity } = require('../models/setEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class SetDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(SetEntity.DATABASE_SUFFIX)).initialize();

    static SETS = [];

    static async RetrieveAllSets() {
        console.log(`Starting to load sets from the database...`);
        
        this.SETS = [];

        let documents = await this.store.openSession().query({ indexName: `all${SetEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.SETS.push(new SetEntity(document));
        }

        console.log(` - Found ${this.SETS.filter(x => x.Official).length} official sets in the database...`);
        console.log(` - Found ${this.SETS.filter(x => !x.Official).length} unofficial sets in the database...`);
        console.log(`Loaded ${this.SETS.length} total sets from the database!\n`);
    }
}

module.exports = { SetDao }