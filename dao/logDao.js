const { v4 } = require('uuid');
const { BaseLogEntity } = require('../models/baseLogEntity');
const { CardResultLogEntity } = require('../models/cardResultLogEntity');
const { CollectionResultLogEntity } = require('../models/collectionResultLogEntity');
const { CommandLogEntity } = require('../models/commandLogEntity');
const { RuleResultLogEntity } = require('../models/ruleResultLogEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class LogDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(BaseLogEntity.DATABASE_SUFFIX)).initialize();

    static async RetrieveLogCountByCardId(cardId) {
        const session = this.store.openSession();

        let documents = await session.query({ indexName: 'allcardresults' })
            .whereEquals('CardId', cardId)
            .all();

        let results = [];

        for (let document of documents) {
            results.push(document);
        }

        return results.length;
    }

    static async RetrieveLogs(index, cutoff, guildId = null, userId = null) {
        const session = this.store.openSession();

        let documents;
        
        if (userId) documents = await session.query({ indexName: index })
            .search('UserId', userId).andAlso()
            .whereGreaterThanOrEqual('Timestamp', cutoff)
            .all();
        else if (guildId) documents = await session.query({ indexName: index })
            .search('GuildId', guildId).andAlso()
            .whereGreaterThanOrEqual('Timestamp', cutoff)
            .all();
        else documents = await session.query({ indexName: index })
            .whereGreaterThanOrEqual('Timestamp', cutoff)
            .all();
        
        let results = [];

        for (let document of documents) {
            let entity;

            switch (index) {
                case `all${CardResultLogEntity.COLLECTION}`:
                    entity = new CardResultLogEntity(document);
                    break;
                case `all${CollectionResultLogEntity.COLLECTION}`:
                    entity = new CollectionResultLogEntity(document);
                    break;
                case `all${CommandLogEntity.COLLECTION}`:
                    entity = new CommandLogEntity(document);
                    break;
                case `all${RuleResultLogEntity.COLLECTION}`:
                    entity = new RuleResultLogEntity(document);
                    break;
            }

            results.push(entity);
        }

        return results.length > 0 ? results : null;
    }

    static async StoreLogEntity(logEntity) {
        if (logEntity.UserId === '132708937584607233') return;

        const session = this.store.openSession();
        let id = v4();

        try {
            await session.store(logEntity, id);
            await session.saveChanges();
    
            console.log(`Stored '${id}' into the database!`);
        }
        catch (exception) {
            console.log(e);
        }
    }
}

module.exports = { LogDao }