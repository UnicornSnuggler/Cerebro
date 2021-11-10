const { CommandLogEntity } = require('../models/commandLogEntity');
const { LogDao } = require('../dao/logDao');
const { CardResultLogEntity } = require('../models/cardResultLogEntity');
const { CollectionResultLogEntity } = require('../models/collectionResultLogEntity');
const { RuleResultLogEntity } = require('../models/ruleResultLogEntity');
const { GetPrintingByArtificialId } = require('./cardHelper');

const BuildBaseEntity = function(context, collection) {
    let userId = context.type != 'DEFAULT' ? context.user.id : context.author.id;
    let guildId = context.guildId;

    let entity = {
        Deleted: false,
        GuildId: guildId,
        Timestamp: Date.now(),
        UserId: userId,
        '@metadata': {
            '@collection': collection
        }
    };

    return entity;
}

const BuildBaseOrganizedEntity = function(context, collection, packId, setId) {
    let entity = BuildBaseEntity(context, collection);

    entity.PackId = packId;
    entity.SetId = setId;

    return entity;
}

exports.LogCardResult = function(context, card) {
    let collection = `all${CardResultLogEntity.COLLECTION}`;
    let firstPrinting = GetPrintingByArtificialId(card, card.Id);
    let entity = BuildBaseOrganizedEntity(context, collection, firstPrinting.PackId, firstPrinting.SetId);

    entity.CardId = card.Id;

    LogDao.StoreLogEntity(entity);
}

exports.LogCollectionResult = function(context, collectionEntity, type) {
    let collection = `all${CollectionResultLogEntity.COLLECTION}`;
    let packId = type === 'pack' ? collectionEntity.Id : null;
    let setId = type === 'set' ? collectionEntity.Id : null;
    let entity = BuildBaseOrganizedEntity(context, collection, packId, setId);

    LogDao.StoreLogEntity(entity);
}

exports.LogCommand = function(context, command, options) {
    let collection = `all${CommandLogEntity.COLLECTION}`;
    let entity = BuildBaseEntity(context, collection);

    entity.Command = command;
    entity.Options = options;
    entity.Shorthand = context.type != 'APPLICATION_COMMAND';

    LogDao.StoreLogEntity(entity);
}

exports.LogRuleResult = function(context, rule) {
    let collection = `all${RuleResultLogEntity.COLLECTION}`;
    let entity = BuildBaseEntity(context, collection);

    entity.RuleId = rule.Id;

    LogDao.StoreLogEntity(entity);
}