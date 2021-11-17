const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { SetDao } = require('../dao/setDao');
const { FindUniqueArts, GetPrintingByArtificialId, Imbibe, BuildCollectionFromBatch } = require('../utilities/cardHelper');
const { LogCardResult, LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, SendMessageWithOptions, Authorized } = require('../utilities/messageHelper');
const { SYMBOLS, LOAD_APOLOGY, INTERACT_APOLOGY, SELECT_TIMEOUT } = require('../constants');

const SelectBox = async function(context, cards) {
    let selector = new MessageSelectMenu()
        .setCustomId('selector')
        .setPlaceholder('No card selected...');

    let prompt = `${cards.length} results were found for the given query!`;
    let items = cards;

    if (cards.length > 25) {
        items = cards.slice(0, 25);
        prompt += ' Only the top 25 results could be shown.';
    }

    prompt += '\n\nPlease select from the following...';
    
    for (let card of items) {
        let description = card.Type;
        let setId = GetPrintingByArtificialId(card, card.Id).SetId ?? null;
        
        if (setId) {
            let set = SetDao.SETS.find(x => x.Id === setId);

            if (card.Classification === 'Hero' && !['Alter-Ego', 'Hero'].includes(card.Type)) description = `${set.Name} ${description}`;
            else if (card.Classification === 'Encounter') description = `${description} (${set.Name})`;
        }
        else description = `${card.Classification} ${description}`;
        
        let emoji = null;

        if (card.Resource) emoji = SYMBOLS[card.Resource];

        selector.addOptions([{
            label: `${card.Name}${card.Subname ? ` (${card.Subname})` : ''}`,
            description: description,
            emoji: emoji,
            value: card.Id
        }]);
    }

    let selectMenuRow = new MessageActionRow().addComponents(selector);
    let buttonRow = new MessageActionRow()
        .addComponents(new MessageButton()
            .setCustomId('browse')
            .setLabel('Browse Results')
            .setStyle('PRIMARY'))
        .addComponents(new MessageButton()
            .setCustomId('cancel')
            .setLabel('Cancel Selection')
            .setStyle('DANGER'));

    let promise = SendContentAsEmbed(context, prompt, [selectMenuRow, buttonRow]);
    
    promise.then((message) => {
        let collector = message.createMessageComponentCollector({ time: SELECT_TIMEOUT * 1000 });

        collector.on('collect', async i => {
            let userId = context.type != 'DEFAULT' ? context.user.id : context.author.id;

            if (i.user.id === userId) {
                if (i.componentType === 'BUTTON') {
                    if (i.customId === 'browse') {
                        collector.stop('selection');
        
                        i.deferUpdate()
                        .then(() => {
                            QueueBatchResult(context, items, message);
                        });
                    }
                    else {
                        collector.stop('cancel');
                    }
                }
                else {
                    let card = items.find(x => x.Id === i.values[0]);
    
                    collector.stop('selection');
    
                    i.deferUpdate()
                    .then(() => {
                        QueueCardResult(context, card, message);
                    });
                }
            }
            else {
                i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
            }
        });

        collector.on('end', (i, reason) => {
            let content;

            if (reason === 'selection') content = LOAD_APOLOGY;
            else if (reason === 'cancel') content = 'Selection was canceled...';
            else content = 'The timeout was reached...';
            
            RemoveComponents(message, content);
        });
    });
}

const QueueCardResult = async function(context, card, message = null) {
    new Promise(() => LogCardResult(context, card));

    let collection = await CardDao.FindFacesAndElements(card);

    let expandedCard = collection.cards.find(x => x.Id === card.Id);
    let currentArtStyle = FindUniqueArts(card).indexOf(card.Id);
    let currentFace = collection.faces.length > 0 ? collection.faces.findIndex(x => x === expandedCard.Id) : -1;
    let currentStage = collection.elements.length > 0 ? collection.elements.findIndex(x => x.cardId === expandedCard.Id) : -1;

    Imbibe(context, expandedCard, currentArtStyle, currentFace, currentStage, collection, false, false, message);
}

const QueueBatchResult = async function(context, batch, message = null) {
    let collection = BuildCollectionFromBatch(batch);

    let card = collection.cards[0];
    let currentArtStyle = 0;
    let currentFace = collection.faces.length > 0 ? 0 : -1;
    let currentElement = 0;

    Imbibe(context, card, currentArtStyle, currentFace, currentElement, collection, false, false, message);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Query cards.')
        .addSubcommandGroup(subcommand =>
            subcommand
                .setName('official')
                .setDescription('Query an official card.')
                .addSubcommand(subsubcommand =>
                    subsubcommand
                        .setName('name')
                        .setDescription('Query cards by their title and subtitle.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true)))
                .addSubcommand(subsubcommand =>
                    subsubcommand
                        .setName('text')
                        .setDescription('Query cards by the text in their textbox.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true)))
                .addSubcommand(subsubcommand =>
                    subsubcommand
                        .setName('traits')
                        .setDescription('Query cards by their traits.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true))))
        .addSubcommandGroup(subcommand =>
            subcommand
                .setName('unofficial')
                .setDescription('Query an unofficial card.')
                .addSubcommand(subsubcommand =>
                    subsubcommand
                        .setName('name')
                        .setDescription('Query cards by their title and subtitle.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true)))
                .addSubcommand(subsubcommand =>
                    subsubcommand
                        .setName('text')
                        .setDescription('Query cards by the text in their textbox.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true)))
                .addSubcommand(subsubcommand =>
                    subsubcommand
                        .setName('traits')
                        .setDescription('Query cards by their traits.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true)))),
    async execute(context) {
        if (!Authorized(context)) return;

        try {
            let subCommand = context.options.getSubcommand();
            let subCommandGroup = context.options.getSubcommandGroup();
            let command = `/card ${subCommandGroup} ${subCommand}`;
            
            let terms = context.options.getString('terms');
            let official = subCommandGroup === 'official';

            new Promise(() => LogCommand(context, command, terms));

            let results = [];
            
            if (subCommand === 'name') results = await CardDao.RetrieveByName(terms, official);
            else if (subCommand === 'text') results = await CardDao.RetrieveByText(terms, official);
            else if (subCommand === 'traits') {
                terms = terms.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, ''));
                results = await CardDao.RetrieveByTraits(terms, official);
            }
            
            if (!results || results.length === 0) SendContentAsEmbed(context, 'No results were found for the given query...');
            else if (results.length === 1) QueueCardResult(context, results[0]);
            else if (results.length > 1) SelectBox(context, results);
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(context, 'Something went wrong... Check the logs to find out more.');
        }
    }
}