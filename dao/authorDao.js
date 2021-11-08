const { AuthorEntity } = require('../models/authorEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class AuthorDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(AuthorEntity.DATABASE_SUFFIX)).initialize();

    static AUTHORS = [];

    static async RetrieveAllAuthors() {
        console.log(`Starting to load authors from the database...`);
        
        this.AUTHORS = [];

        let documents = await this.store.openSession().query({ indexName: `all${AuthorEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.AUTHORS.push(new AuthorEntity(document));
        }

        console.log(` - Found ${documents.length} authors in the database...`);
        console.log(`Loaded ${this.AUTHORS.length} total authors from the database!\n`);
    }
}

module.exports = { AuthorDao }