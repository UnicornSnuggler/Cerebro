const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { SetDao } = require('../dao/setDao');
const { FindUniqueArts, GetPrintingByArtificialId, Imbibe, BuildCollectionFromBatch, ResourceConverter } = require('../utilities/cardHelper');
const { LogCardResult, LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');
const { SYMBOLS, LOAD_APOLOGY, INTERACT_APOLOGY, SELECT_TIMEOUT } = require('../constants');
const { ConfigurationDao } = require('../dao/configurationDao');

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
            let userId = context.user ? context.user.id : context.author.id;

            if (i.user.id === userId) {
                if (i.componentType === 'BUTTON') {
                    if (i.customId === 'browse') {
                        collector.stop('selection');
        
                        i.deferUpdate()
                        .then(() => {
                            QueueBatchResult(context, cards, message);
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
        .addStringOption(option =>
            option
                .setName('origin')
                .setDescription('The origin of the card.')
                .setRequired(true)
                .addChoice('official', 'official')
                .addChoice('unofficial', 'unofficial')
                .addChoice('all', 'all'))
        .addStringOption(option =>
            option
                .setName('aspect')
                .setDescription('Query cards by their aspect.')
                .setRequired(false)
                .addChoice('aggression', 'aggression')
                .addChoice('basic', 'basic')
                .addChoice('determination', 'determination')
                .addChoice('encounter', 'encounter')
                .addChoice('hero', 'hero')
                .addChoice('justice', 'justice')
                .addChoice('leadership', 'leadership')
                .addChoice('protection', 'protection'))
        .addMentionableOption(option =>
            option
                .setName('author')
                .setDescription('Query unofficial cards by their author.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('cost')
                .setDescription('Query cards by their cost.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Query cards by their title and subtitle.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('resource')
                .setDescription('Query cards by their printed resource.')
                .setRequired(false)
                .addChoice('energy', 'energy')
                .addChoice('mental', 'mental')
                .addChoice('physical', 'physical')
                .addChoice('wild', 'wild')
                .addChoice('none', 'none'))
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('Query cards by the text in their textbox.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('traits')
                .setDescription('Query cards by their traits.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Query cards by their type.')
                .setRequired(false)
                .addChoice('ally', 'ally')
                .addChoice('alter-ego', 'alter-ego')
                .addChoice('attachment', 'attachment')
                .addChoice('environment', 'environment')
                .addChoice('event', 'event')
                .addChoice('hero', 'hero')
                .addChoice('main scheme', 'main scheme')
                .addChoice('minion', 'minion')
                .addChoice('obligation', 'obligation')
                .addChoice('resource', 'resource')
                .addChoice('side scheme', 'side scheme')
                .addChoice('support', 'support')
                .addChoice('treachery', 'treachery')
                .addChoice('upgrade', 'upgrade')
                .addChoice('villain', 'villain')),
    async execute(context) {
        if (!Authorized(context)) return;

        try {
            let command = `/card`;
            let origin = context.options.getString('origin');
            
            let aspectOption = context.options.getString('aspect');
            let aspect = aspectOption ? aspectOption.toLowerCase() : null;
            
            let authorOption = context.options.getMentionable('author');
            let author = authorOption ? authorOption.id : null;
            
            let cost = context.options.getString('cost');
            
            let nameOption = context.options.getString('name');
            let name = nameOption ? nameOption.toLowerCase() : null;
            
            let resourceOption = context.options.getString('resource');
            let resource = resourceOption ? resourceOption.toLowerCase() : null;
            
            let textOption = context.options.getString('text');
            let text = textOption ? textOption.toLowerCase() : null;

            let traitsOption = context.options.getString('traits');
            let traits = traitsOption ? traitsOption.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, '')) : null;
            
            let typeOption = context.options.getString('type');
            let type = typeOption ? typeOption.toLowerCase() : null;

            if (origin !== 'official' && context.guildId) {
                if (ConfigurationDao.CONFIGURATION.UnofficialRestrictions[context.guildId] && !ConfigurationDao.CONFIGURATION.UnofficialRestrictions[context.guildId].includes(context.channelId)) {
                    SendContentAsEmbed(context, `Unofficial content queries are restricted to the following channels:${ConfigurationDao.CONFIGURATION.UnofficialRestrictions[context.guildId].map(x => `\n<#${x}>`).join('')}`, null, true);
                    return;
                }
            }
            
            if (!aspect && !author && !cost && !name && !resource && !text && !traits && !type) {
                SendContentAsEmbed(context, 'You must specify at least one search criteria...', null, true);
                return;
            }

            new Promise(() => LogCommand(context, command, null));

            let results = [];

            if (name) {
                results = await CardDao.RetrieveByName(name, origin);

                if (results) {
                    if (aspect) results = results.filter(card => card.Classification.toLowerCase() === aspect);
                    if (author) results = results.filter(card => card.AuthorId === author);
                    if (cost) results = results.filter(card => card.Cost && card.Cost.toLowerCase() === cost);
                    if (resource) {
                        if (resource === 'none') {
                            results = results.filter(card => !card.Resource);
                        }
                        else {
                            results = results.filter(card => card.Resource && card.Resource.toLowerCase().includes(ResourceConverter[resource]));
                        }
                    }
                    if (text) results = results.filter(card => (card.Rules && card.Rules.toLowerCase().includes(text)) || (card.Special && card.Special.toLowerCase().includes(text)));
                    if (traits) results = results.filter(card => card.Traits && traits.every(element => card.Traits.find(trait => trait.toLowerCase() === element.trim())));
                    if (type) results = results.filter(card => card.Type.toLowerCase() === type);
                }
            }
            else {
                results = await CardDao.RetrieveWithFilters(origin, aspect, author, cost, resource, text, traits, type);
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