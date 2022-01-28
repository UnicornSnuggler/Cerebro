const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class ConfigurationDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase('configurations')).initialize();

    static CONFIGURATION = {};

    static async RetrieveConfiguration() {
        console.log(`Starting to load the primary configuration from the database...`);
        
        this.CONFIGURATION = {};

        let documents = await this.store.openSession().query({ collection:'primary' }).all();

        for (let document of documents) {
            this.CONFIGURATION = document;
        }

        console.log(` - Found ${documents.length} configuration in the database...`);
        console.log(`Loaded the primary configuration from the database!\n`);
    }
}

module.exports = { ConfigurationDao }