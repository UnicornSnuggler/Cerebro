const { SetEntity } = require('../models/setEntity');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

class SetDao {
    constructor() { }

    static store = CreateDocumentStore(SetEntity.DATABASE).initialize();

    static SETS = [];

    static async RetrieveAllSets() {
        console.log(`Starting to load sets from the database...`);
        
        this.SETS = [];

        for (var index of SetEntity.INDEXES) {
            var documents = await this.store.openSession().query({ indexName: index }).all();
    
            for (var document of documents) {
                this.SETS.push(new SetEntity(document));
            }

            console.log(` - Found ${documents.length} sets from index '${index}'...`);
        }

        console.log(`Loaded ${this.SETS.length} total sets from the database!\n`);
    }
}

module.exports = { SetDao }