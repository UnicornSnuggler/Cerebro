const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { AuthorDao } = require('../dao/authorDao');
const { CardDao } = require('../dao/cardDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { Imbibe } = require('../utilities/cardHelper');
const { LogCommand, LogCollectionResult } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed } = require('../utilities/messageHelper');
const { LOAD_APOLOGY, INTERACT_APOLOGY, SELECT_TIMEOUT } = require('../constants');

const SelectBox = async function(context, collectionEntities, type) {
    let selector = new MessageSelectMenu()
        .setCustomId('selector')
        .setPlaceholder(`No ${type} selected...`);

    let prompt = `${collectionEntities.length} results were found for the given query!`;

    if (collectionEntities.length > 25) {
        collectionEntities = collectionEntities.slice(0, 25);
        prompt += ' Only the top 25 results could be shown.';
    }

    prompt += '\n\nPlease select from the following...';
    
    for (let collectionEntity of collectionEntities) {
        let author = AuthorDao.AUTHORS.find(x => x.Id === collectionEntity.AuthorId);
        let description = `${collectionEntity.Type}${!collectionEntity.Official ? ` by ${author.Name}` : ''}`;

        selector.addOptions([{
            label: collectionEntity.Name,
            description: description,
            value: collectionEntity.Id
        }]);
    }

    let components = new MessageActionRow().addComponents(selector);

    let promise = SendContentAsEmbed(context, prompt, [components]);
    
    promise.then((message) => {
        let collector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: SELECT_TIMEOUT * 1000 });

        collector.on('collect', async i => {
            let userId = context.type != 'DEFAULT' ? context.user.id : context.author.id;

            if (i.user.id === userId) {
                let collectionEntity = collectionEntities.find(x => x.Id === i.values[0]);

                collector.stop('selection');

                i.deferUpdate()
                .then(() => {
                    QueueCollectionResult(context, collectionEntity, type, message);
                });
            }
            else {
                i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
            }
        });

        collector.on('end', (i, reason) => {
            let content = 'The timeout was reached...';

            if (reason === 'selection') content = LOAD_APOLOGY;
            
            RemoveComponents(message, content);
        });
    });
}

const QueueCollectionResult = async function(context, collectionEntity, type, message = null) {
    new Promise(() => LogCollectionResult(context, collectionEntity, type));

    type = type.charAt(0).toUpperCase() + type.slice(1);
    let collection = await CardDao.RetrieveByCollection(collectionEntity, type);

    let card = collection.cards[0];
    let currentArtStyle = 0;
    let currentFace = collection.faces.length > 0 ? 0 : -1;
    let currentElement = 0;

    Imbibe(context, card, currentArtStyle, currentFace, currentElement, collection, false, false, message);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('browse')
        .setDescription('Browse all of the cards in a collection.')
        .addSubcommandGroup(subcommand =>
            subcommand
                .setName('official')
                .setDescription('Browse all of the cards in an official collection.')
                .addSubcommand(subsubcommand => 
                    subsubcommand
                        .setName('pack')
                        .setDescription('Browse all of the cards in an official pack.')
                        .addStringOption(option => option.setName('name').setDescription('The name of the pack being queried.').setRequired(true)))
                .addSubcommand(subsubcommand => 
                    subsubcommand
                        .setName('set')
                        .setDescription('Browse all of the cards in an official set.')
                        .addStringOption(option => option.setName('name').setDescription('The name of the set being queried.').setRequired(true))))
            .addSubcommandGroup(subcommand =>
                subcommand
                    .setName('unofficial')
                    .setDescription('Browse all of the cards in an unofficial collection.')
                    .addSubcommand(subsubcommand => 
                        subsubcommand
                            .setName('pack')
                            .setDescription('Browse all of the cards in an unofficial pack.')
                            .addStringOption(option => option.setName('name').setDescription('The name of the pack being queried.').setRequired(true)))
                    .addSubcommand(subsubcommand => 
                        subsubcommand
                            .setName('set')
                            .setDescription('Browse all of the cards in an unofficial set.')
                            .addStringOption(option => option.setName('name').setDescription('The name of the set being queried.').setRequired(true)))),
    async execute(context) {
        let subCommand = context.options.getSubcommand();
        let subCommandGroup = context.options.getSubcommandGroup();
        let command = `/browse ${subCommandGroup} ${subCommand}`;

        try {
            let query = context.options.getString('name');

            new Promise(() => LogCommand(context, command, query));

            let official = subCommandGroup === 'official';
            
            let convertedQuery = query.normalize('NFD').replace(/[^a-z0-9 -]/gmi, '').toLowerCase();
            let queryTokens = convertedQuery.replace(/[-]/gmi, ' ').split(' ');
            let strippedQuery = convertedQuery.replace(/[^a-z0-9]/gmi, '');

            let collections = subCommand === 'pack' ? PackDao.PACKS : SetDao.SETS;

            let results = collections.filter(collection => {
                if (collection.Official != official) return false;

                let convertedCollectionName = collection.Name.normalize('NFD').replace(/[^a-z0-9 -]/gmi, '').toLowerCase();
                let collectionNameTokens = convertedCollectionName.replace(/[-]/gmi, ' ').split(' ');
                let strippedCollectionName = convertedCollectionName.replace(/[^a-z0-9]/gmi, '');

                if (convertedCollectionName === convertedQuery) return true;
                else {
                    if (queryTokens.every(x => collectionNameTokens.includes(x))) return true;
                    else {
                        if (strippedCollectionName.includes(strippedQuery)) return true;
                        else return false;
                    }
                }
            });
            
            if (!results || results.length === 0) SendContentAsEmbed(context, 'No results were found for the given query...');
            else if (results.length > 1) SelectBox(context, results, subCommand);
            else if (results.length === 1) QueueCollectionResult(context, results[0], subCommand);
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(context, 'Something went wrong... Check the logs to find out more.');
        }
    }
}