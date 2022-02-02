const { v4 } = require('uuid');
const { RequestEntity } = require('../models/requestEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class RequestDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(RequestEntity.DATABASE_SUFFIX)).initialize();

    static async DeleteRequestById(requestId) {
        const session = this.store.openSession();

        try {
            let document = await session.load(requestId);
            
            document.Deleted = true;

            await session.saveChanges();

            console.log(`Marked request '${requestId}' as deleted...`);
        }
        catch (exception) {
            console.log(exception);
        }
    }
    
    static async RetrieveAllRequests(type) {
        const session = this.store.openSession();

        let query = session.query({ indexName: `allrequests` });

        if (type !== 'all') {
            query = query.whereEquals('Type', type);
        }

        let documents = await query.all();
        
        let results = [];
        
        for (let document of documents) {
            let entity = new RequestEntity(document);
            
            results.push(entity);
        }
        
        return results.length > 0 ? results : null;
    }

    static async RetrieveRequestById(requestId) {
        const session = this.store.openSession();

        let documents = await session.query({ indexName: `allrequests` })
            .whereRegex('id()', requestId)
            .all();

        let results = [];

        for (let document of documents) {
            let entity = new RequestEntity(document);

            results.push(entity);
        }

        return results.length > 0 ? results : null;
    }

    static async RetrieveRequestsByUserId(userId, type) {
        const session = this.store.openSession();

        let query = session.query({ indexName: `allrequests` })
            .whereEquals('UserId', userId);

        if (type !== 'all') {
            query = query.andAlso()
                .whereEquals('Type', type);
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

        await session.store(requestEntity, id);
        await session.saveChanges();

        console.log(`Stored request '${id}' into the database!`);

        return id;
    }

    static async UpdateRequestFlagById(requestId, newFlag, reasoning) {
        const session = this.store.openSession();

        let document = await session.load(requestId);
        
        document.Flag = newFlag;

        if (reasoning) {
            document.Reasoning = reasoning;
        }

        await session.saveChanges();

        console.log(`Marked request '${requestId}' as '${newFlag}'...`);
    }
}

module.exports = { RequestDao }