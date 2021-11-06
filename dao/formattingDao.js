const { FormattingEntity } = require('../models/formattingEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class FormattingDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(FormattingEntity.DATABASE_SUFFIX)).initialize();

    static FORMATTINGS = [];

    static async RetrieveAllFormattings() {
        console.log(`Starting to load formattings from the database...`);
        
        this.FORMATTINGS = [];

        let documents = await this.store.openSession().query({ indexName: FormattingEntity.COLLECTION }).all();

        for (let document of documents) {
            this.FORMATTINGS.push(new FormattingEntity(document));
        }

        console.log(` - Found ${documents.length} formattings in the database...`);
        console.log(`Loaded ${this.FORMATTINGS.length} total formattings from the database!\n`);
    }
}

module.exports = { FormattingDao }