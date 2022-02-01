const { MessageEmbed } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { LogDao } = require('../dao/logDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { CardResultLogEntity } = require('../models/cardResultLogEntity');
const { CollectionResultLogEntity } = require('../models/collectionResultLogEntity');
const { CommandLogEntity } = require('../models/commandLogEntity');
const { RuleResultLogEntity } = require('../models/ruleResultLogEntity');
const { GetPrintingByArtificialId, BuildCardImagePath } = require('./cardHelper');
const { COLORS } = require('../constants');
const { CapitalizedTitleElement } = require('./stringHelper');

const BuildBaseEntity = function(context, collection) {
    let userId = context.user ? context.user.id : context.author.id;
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

exports.BuildCardResultsEmbed = async function(results, scale, timeframe) {
    let embed = new MessageEmbed();

    embed.setColor(COLORS["Basic"]);
    embed.setTitle(`${CapitalizedTitleElement(scale)} ${CapitalizedTitleElement(timeframe)} Card Statistics`);

    let resultEntries = [];

    if (results) {
        let ids = results.map(x => x.CardId).filter(function(value, index, self) {
            return self.indexOf(value) === index;
        });

        let cards = await CardDao.RetrieveByIdList(ids);

        for (let id of ids) {
            let matches = results.filter(x => x.CardId === id);
            let card = cards.find(x => x.Id === id);
            let timestamp = matches.sort((a, b) => b.Timestamp - a.Timestamp)[0].Timestamp;
            let imagePath = BuildCardImagePath(card, card.Id);
            let description = card.Type;
            
            let setId = GetPrintingByArtificialId(card, card.Id).SetId ?? null;
            
            if (setId) {
                let set = SetDao.SETS.find(x => x.Id === setId);

                if (card.Classification === 'Hero' && !['Alter-Ego', 'Hero'].includes(card.Type)) description = `${set.Name} ${description}`;
                else if (card.Classification === 'Encounter') description = `${description} (${set.Name})`;
            }
            else description = `${card.Classification} ${description}`;

            resultEntries.push({
                description: `[${card.Name}](${imagePath}) ${card.Official ? '' : 'Unofficial '}${description}`,
                count: matches.length,
                timestamp: timestamp
            });
        }
    }

    embed.setDescription(DeriveEmbedDescription(resultEntries));

    return embed;
}

exports.BuildPackResultsEmbed = async function(results, scale, timeframe) {
    let embed = new MessageEmbed();

    embed.setColor(COLORS["Basic"]);
    embed.setTitle(`${CapitalizedTitleElement(scale)} ${CapitalizedTitleElement(timeframe)} Pack Statistics`);

    let resultEntries = [];

    if (results) {
        let ids = results.map(x => x.PackId).filter(function(value, index, self) {
            return value && self.indexOf(value) === index;
        });

        for (let id of ids) {
            let pack = PackDao.PACKS.find(x => x.Id === id);
            let matches = results.filter(x => x.PackId === id);
            let timestamp = matches.sort((a, b) => b.Timestamp - a.Timestamp)[0].Timestamp;

            resultEntries.push({
                description: `**${pack.Name}** (${pack.Official ? '' : 'Unofficial '}${pack.Type})`,
                count: matches.length,
                timestamp: timestamp
            });
        }
    }

    embed.setDescription(DeriveEmbedDescription(resultEntries));

    return embed;
}

exports.BuildSetResultsEmbed = async function(results, scale, timeframe) {
    let embed = new MessageEmbed();

    embed.setColor(COLORS["Basic"]);
    embed.setTitle(`${CapitalizedTitleElement(scale)} ${CapitalizedTitleElement(timeframe)} Set Statistics`);

    let resultEntries = [];

    if (results) {
        let ids = results.map(x => x.SetId).filter(function(value, index, self) {
            return value && self.indexOf(value) === index;
        });

        for (let id of ids) {
            let set = SetDao.SETS.find(x => x.Id === id);
            let matches = results.filter(x => x.SetId === id);
            let timestamp = matches.sort((a, b) => b.Timestamp - a.Timestamp)[0].Timestamp;

            resultEntries.push({
                description: `**${set.Name}** (${set.Official ? '' : 'Unofficial '}${set.Type})`,
                count: matches.length,
                timestamp: timestamp
            });
        }
    }

    embed.setDescription(DeriveEmbedDescription(resultEntries));

    return embed;
}

exports.BuildUserResultsEmbed = async function(results, scale, timeframe) {
    let embed = new MessageEmbed();

    embed.setColor(COLORS["Basic"]);
    embed.setTitle(`${CapitalizedTitleElement(scale)} ${CapitalizedTitleElement(timeframe)} User Statistics`);

    let resultEntries = [];

    if (results) {
        let ids = results.map(x => x.UserId).filter(function(value, index, self) {
            return value && self.indexOf(value) === index;
        });

        for (let id of ids) {
            let matches = results.filter(x => x.UserId === id);
            let timestamp = matches.sort((a, b) => b.Timestamp - a.Timestamp)[0].Timestamp;

            resultEntries.push({
                description: `<@${id}> — ${matches.length} Queries`,
                count: matches.length,
                timestamp: timestamp
            });
        }
    }

    embed.setDescription(DeriveEmbedDescription(resultEntries));

    return embed;
}

const DeriveEmbedDescription = function(resultEntries) {
    let popularityArray = [];
    let recentArray = [];
    
    resultEntries.sort(function(a, b) {
        if (a.count != b.count) return b.count - a.count;
        else return b.timestamp - a.timestamp;
    }).slice(0, 10).forEach(entry => popularityArray.push(`${popularityArray.length + 1}. ${entry.description}`));

    resultEntries.sort(function(a, b) {
        return b.timestamp - a.timestamp;
    }).slice(0, 10).forEach(entry => recentArray.push(`${recentArray.length + 1}. ${entry.description}`));

    return `**Most Popular**\n${popularityArray.length > 0 ? popularityArray.join('\n') : 'No data to show...'}\n\n**Most Recent**\n${recentArray.length > 0 ? recentArray.join('\n') : 'No data to show...'}`;
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