const { v4 } = require('uuid');
const { RequestEntity } = require('../models/requestEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class RequestDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(RequestEntity.DATABASE_SUFFIX)).initialize();

    static async RetrieveRequestsByUserId(userId, type) {
        const session = this.store.openSession();

        let documents = await session.query({ indexName: `${type}requests` })
            .whereEquals('UserId', userId)
            .all();

        let results = [];

        for (let document of documents) {
            results.push(document);
        }

        return results.length > 0 ? results : null;
    }

    static async RetrieveAllRequests(type, override) {
        const session = this.store.openSession();

        let query = session.query({ indexName: `${type}requests` });

        if (!override) {
            query = query
                .whereEquals('Flag', 1)
                .orElse()
                .whereEquals('Flag', 2);
        }

        let documents = await query.all();
        
        let results = [];

        for (let document of documents) {
            let entity = new RequestEntity(document);

            results.push(entity);
        }

        return results.length > 0 ? results : null;
    }

    static async StoreRequestEntity(requestEntity) {
        const session = this.store.openSession();
        let id = v4();

        try {
            await session.store(requestEntity, id);
            await session.saveChanges();
    
            console.log(`Stored '${id}' into the database!`);
        }
        catch (exception) {
            console.log(e);
        }
    }
}

module.exports = { RequestDao }