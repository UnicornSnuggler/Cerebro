const { ArtistEntity } = require('../models/artistEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class ArtistDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(ArtistEntity.DATABASE_SUFFIX)).initialize();

    static ARTISTS = [];

    static async RetrieveAllArtists() {
        console.log(`Starting to load artists from the database...`);
        
        this.ARTISTS = [];

        let documents = await this.store.openSession().query({ indexName: `all${ArtistEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.ARTISTS.push(new ArtistEntity(document));
        }

        console.log(` - Found ${documents.length} artists in the database...`);
        console.log(`Loaded ${this.ARTISTS.length} total artists from the database!\n`);
    }
}

module.exports = { ArtistDao }