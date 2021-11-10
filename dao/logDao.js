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

    static async RetrieveLogsByGuildId(guildId, index) {
        const session = this.store.openSession();

        let documents = await session.query({ indexName: index })
            .search('GuildId', guildId)
            .all();
        
        let results = [];

        for (let document of documents) {
            let entity;

            switch (index) {
                case CollectionResultLogEntity.COLLECTION:
                    entity = new CollectionResultLogEntity(document);
                    break;
                case RuleResultLogEntity.COLLECTION:
                    entity = new RuleResultLogEntity(document);
                    break;
                case CardResultLogEntity.COLLECTION:
                    entity = new CardResultLogEntity(document);
                    break;
                case CommandLogEntity.COLLECTION:
                    entity = new CommandLogEntity(document);
                    break;
            }

            results.push(entity);
        }

        return results.length > 0 ? results : null;
    }

    static async StoreLogEntity(logEntity) {
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