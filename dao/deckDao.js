const { ObjectId } = require('mongodb/lib/bson');
const { ALL, OFFICIAL } = require('../constants');
const { DeckEntity } = require('../models/deckEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');
const { MongoClient } = require('mongodb');

class DeckDao {
    constructor() { }

    static mongoClient = new MongoClient(process.env.mongoConnectionString);

    static async DeleteDeck(id) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(DeckEntity.DATABASE).collection(DeckEntity.COLLECTION).deleteOne({ _id: new ObjectId(id) });
        }
        catch (e) {
            if (e.name != 'MongoServerError') {
                console.error(`An error occurred while deleting an existing deck!\n${e}`);
            }
            else {
                result = e;
            }
        }
        finally {
            await this.mongoClient.close();
        }

        return result;
    }

    static async RetrieveAllDecks() {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(DeckEntity.DATABASE).collection(DeckEntity.COLLECTION).find({}).toArray();
        }
        catch (e) {
            console.error(`An error occurred while retrieving all decks!\n${e}`);
        }
        finally {
            await this.mongoClient.close();
        }

        return result;
    }

    static async RetrieveDeckWithFilters(filters) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            let query = {};
            
            if (filters.hasOwnProperty('_id')) {
                query._id = new ObjectId(filters._id);
            }

            if (filters.hasOwnProperty('authorId')) {
                query.authorId = new ObjectId(filters.authorId);
            }

            if (filters.hasOwnProperty('heroSetId')) {
                query.heroSetId = filters.heroSetId;
            }

            if (filters.hasOwnProperty('isOfficial')) {
                query.isOfficial = /^true$/i.test(filters.isOfficial);
            }

            if (filters.hasOwnProperty('isPublic')) {
                query.isPublic = /^true$/i.test(filters.isPublic);
            }

            if (filters.hasOwnProperty('title')) {
                query.title = filters.title;
            }

            result = await this.mongoClient.db(DeckEntity.DATABASE).collection(DeckEntity.COLLECTION).find(query, {}).toArray();
        }
        catch (e) {
            console.error(`An error occurred while retrieving a deck with filters!\n${e}`);
        }
        finally {
            await this.mongoClient.close();
        }

        return result;
    }

    static async StoreNewDeck(deck) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(DeckEntity.DATABASE).collection(DeckEntity.COLLECTION).insertOne(deck);
        }
        catch (e) {
            if (e.name != 'MongoServerError') {
                console.error(`An error occurred while storing a new deck!\n${e}`);
            }
            else {
                result = e;
            }
        }
        finally {
            await this.mongoClient.close();
        }

        return result;
    }

    static async UpdateDeck(id, deck) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(DeckEntity.DATABASE).collection(DeckEntity.COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: deck }, {});
        }
        catch (e) {
            if (e.name != 'MongoServerError') {
                console.error(`An error occurred while updating an existing deck!\n${e}`);
            }
            else {
                result = e;
            }
        }
        finally {
            await this.mongoClient.close();
        }

        return result;
    }
}

module.exports = { DeckDao }