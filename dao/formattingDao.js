const { FormattingEntity } = require('../models/formattingEntity');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

class FormattingDao {
    constructor() { }

    static store = CreateDocumentStore(FormattingEntity.DATABASE).initialize();

    static FORMATTINGS = [];

    static async RetrieveAllFormattings() {
        console.log(`Starting to load formattings from the database...`);
        
        this.FORMATTINGS = [];

        for (var index of FormattingEntity.INDEXES) {
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            for (var result of results) {
                this.FORMATTINGS.push(new FormattingEntity(result));
            }

            console.log(` - Found ${results.length} formattings from index '${index}'...`);
        }

        console.log(`Loaded ${this.FORMATTINGS.length} total formattings from the database!\n`);
    }
}

module.exports = { FormattingDao }