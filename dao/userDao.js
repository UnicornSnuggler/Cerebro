const { ObjectId } = require('mongodb/lib/bson');
const { ALL, OFFICIAL } = require('../constants');
const { UserEntity } = require('../models/userEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');
const { MongoClient } = require('mongodb');

class UserDao {
    constructor() { }

    static mongoClient = new MongoClient(process.env.mongoConnectionString);

    static limitedProjection = { projection: { username: 1, created: 1, updated: 1 } };

    static async DeleteUser(id) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(UserEntity.DATABASE).collection(UserEntity.COLLECTION).deleteOne({ _id: new ObjectId(id) });
        }
        catch (e) {
            if (e.name != 'MongoServerError') {
                console.error(`An error occurred while deleting an existing user!\n${e}`);
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

    static async RetrieveAllUsers(limited) {
        let users = [];
        
        try {
            await this.mongoClient.connect();

            const options = limited ? this.limitedProjection : {};

            users = await this.mongoClient.db(UserEntity.DATABASE).collection(UserEntity.COLLECTION).find({}, options).toArray();
        }
        catch (e) {
            console.error(`An error occurred while retrieving all users!\n${e}`);
        }
        finally {
            await this.mongoClient.close();
        }

        return users;
    }

    static async RetrieveUserWithFilters(id, emailAddress, limited) {
        let user = null;
        
        try {
            await this.mongoClient.connect();

            let query = {};

            if (id) {
                query._id = new ObjectId(id);
            }

            if (emailAddress) {
                query.emailAddress = emailAddress;
            }

            const options = limited ? this.limitedProjection : {};

            user = await this.mongoClient.db(UserEntity.DATABASE).collection(UserEntity.COLLECTION).findOne(query, options);
        }
        catch (e) {
            console.error(`An error occurred while retrieving all users!\n${e}`);
        }
        finally {
            await this.mongoClient.close();
        }

        return user;
    }

    static async StoreNewUser(user) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(UserEntity.DATABASE).collection(UserEntity.COLLECTION).insertOne(user);
        }
        catch (e) {
            if (e.name != 'MongoServerError') {
                console.error(`An error occurred while storing a new user!\n${e}`);
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

    static async UpdateUser(id, user) {
        let result = null;
        
        try {
            await this.mongoClient.connect();

            result = await this.mongoClient.db(UserEntity.DATABASE).collection(UserEntity.COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: user }, {});
        }
        catch (e) {
            if (e.name != 'MongoServerError') {
                console.error(`An error occurred while updating an existing user!\n${e}`);
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

module.exports = { UserDao }