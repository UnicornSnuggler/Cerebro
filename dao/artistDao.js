const { ALL } = require('../constants');
const { ArtistEntity } = require('../models/artistEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class ArtistDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(ArtistEntity.DATABASE_SUFFIX)).initialize();

    static ARTISTS = [];

    static async UpdateArtistList() {
        console.log(`Starting to load artists from the database...`);

        this.ARTISTS = await this.RetrieveWithFilters();

        console.log(`Loaded ${this.ARTISTS.length} total artists from the database!\n`);
    }

    static async RetrieveWithFilters(id = null, name = null) {
        const session = this.store.openSession();
        let query = session.query({ indexName: `${ALL}${ArtistEntity.COLLECTION}` });
        
        let results = [];

        if (id) {
            query = query.openSubclause()
                .whereRegex('id()', id)
                .closeSubclause();
        }

        if (name) {
            query = query.openSubclause()
                .whereRegex('Name', name)
                .closeSubclause();
        }

        let documents = await query.all();

        for (let document of documents) {
            results.push(new ArtistEntity(document));
        }

        return results;
    }
}

module.exports = { ArtistDao }