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
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            for (var result of results) {
                this.SETS.push(new SetEntity(result));
            }

            console.log(` - Found ${results.length} sets from index '${index}'...`);
        }

        console.log(`Loaded ${this.SETS.length} total sets from the database!\n`);
    }
}

module.exports = { SetDao }