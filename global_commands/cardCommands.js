const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, inlineCode, ComponentType } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { FindUniqueArts, Imbibe, BuildCollectionFromBatch, ResourceConverter, CreateSelectBox, QueueCompiledResult } = require('../utilities/cardHelper');
const { LogCardResult, LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');
const { LOAD_APOLOGY, INTERACT_APOLOGY, SELECT_TIMEOUT, SECOND_MILLIS, DEFAULT_ART_TOGGLE } = require('../constants');
const { ConfigurationDao } = require('../dao/configurationDao');
const { ReportError } = require('../utilities/errorHelper');
const { GetUserIdFromContext } = require('../utilities/userHelper');

const SelectBox = async function(context, cards) {
    try {
        let prompt = `${cards.length} results were found for the given query!`;
        let items = cards;

        if (cards.length > 25) {
            items = cards.slice(0, 25);
            prompt += ' Only the top 25 results could be shown.';
        }

        prompt += '\n\nPlease select from the following...';

        let selector = CreateSelectBox(items);

        let selectMenuRow = new ActionRowBuilder().addComponents(selector);
        let buttonRow = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId('browse')
                .setLabel('Browse Results')
                .setStyle(ButtonStyle.Primary))
            .addComponents(new ButtonBuilder()
                .setCustomId('showAll')
                .setLabel('Show All')
                .setStyle(ButtonStyle.Primary))
            .addComponents(new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel Selection')
                .setStyle(ButtonStyle.Danger));

        let promise = SendContentAsEmbed(context, prompt, [selectMenuRow, buttonRow]);
        
        promise.then((message) => {
            let collector = message.createMessageComponentCollector({ time: SELECT_TIMEOUT * SECOND_MILLIS });

            collector.on('collect', async i => {
                let userId = GetUserIdFromContext(context);

                if (i.user.id === userId) {
                    if (i.componentType === ComponentType.Button) {
                        if (i.customId === 'browse') {
                            collector.stop('selection');
            
                            i.deferUpdate()
                            .then(() => {
                                QueueBatchResult(context, cards, message);
                            });
                        }
                        if (i.customId === 'showAll') {
                            collector.stop('selection');
            
                            i.deferUpdate()
                            .then(() => {
                                QueueCompiledResult(context, cards, message);
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

                new Promise(() => RemoveComponents(message, content));
            });
        });
    }
    catch (e) {
        ReportError(context, e);
    }
}

const QueueCardResult = async function(context, card, message = null) {
    try {
        new Promise(() => LogCardResult(context, card));
        
        let collection = await CardDao.FindFacesAndElements(card);
        
        let expandedCard = collection.cards.find(x => x.Id === card.Id);
        let currentArtStyle = FindUniqueArts(card).indexOf(card.Id);
        let currentFace = collection.faces.length > 0 ? collection.faces.findIndex(x => x === expandedCard.Id) : -1;
        let currentStage = collection.elements.length > 0 ? collection.elements.findIndex(x => x.cardId === expandedCard.Id) : -1;
        
        Imbibe(context, expandedCard, currentArtStyle, currentFace, currentStage, collection, false, DEFAULT_ART_TOGGLE, message);
    }
    catch (e) {
        ReportError(context, e);
    }
}

const QueueBatchResult = function(context, batch, message = null) {
    try {
        let collection = BuildCollectionFromBatch(batch);

        let card = collection.cards[0];
        let currentArtStyle = 0;
        let currentFace = collection.faces.length > 0 ? 0 : -1;
        let currentElement = 0;

        Imbibe(context, card, currentArtStyle, currentFace, currentElement, collection, false, DEFAULT_ART_TOGGLE, message);
    }
    catch (e) {
        ReportError(context, e);
    }
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
                .addChoices(
                    { name: 'official', value: 'official' },
                    { name: 'unofficial', value: 'unofficial' },
                    { name: 'all', value: 'all' }
                ))
        .addMentionableOption(option =>
            option
                .setName('author')
                .setDescription('Query unofficial cards by their author.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('classification')
                .setDescription('Query cards by their aspect or other classification.')
                .setRequired(false)
                .addChoices(
                    { name: 'aggression', value: 'aggression' },
                    { name: 'aspect', value: 'aspect' },
                    { name: 'basic', value: 'basic' },
                    { name: 'determination', value: 'determination' },
                    { name: 'encounter', value: 'encounter' },
                    { name: 'hero', value: 'hero' },
                    { name: 'justice', value: 'justice' },
                    { name: 'leadership', value: 'leadership' },
                    { name: 'player', value: 'player' },
                    { name: 'protection', value: 'protection' }
                ))
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
                .setName('pack')
                .setDescription('Query cards by their pack.')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('resource')
                .setDescription('Query cards by their printed resource.')
                .setRequired(false)
                .addChoices(
                    { name: 'energy', value: 'energy' },
                    { name: 'mental', value: 'mental' },
                    { name: 'physical', value: 'physical' },
                    { name: 'wild', value: 'wild' },
                    { name: 'none', value: 'none' }
                ))
        .addStringOption(option =>
            option
                .setName('set')
                .setDescription('Query cards by their set.')
                .setRequired(false))
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
                .addChoices(
                    { name: 'ally', value: 'ally' },
                    { name: 'alter-ego', value: 'alter-ego' },
                    { name: 'attachment', value: 'attachment' },
                    { name: 'environment', value: 'environment' },
                    { name: 'event', value: 'event' },
                    { name: 'hero', value: 'hero' },
                    { name: 'main scheme', value: 'main scheme' },
                    { name: 'minion', value: 'minion' },
                    { name: 'obligation', value: 'obligation' },
                    { name: 'resource', value: 'resource' },
                    { name: 'side scheme', value: 'side scheme' },
                    { name: 'support', value: 'support' },
                    { name: 'treachery', value: 'treachery' },
                    { name: 'upgrade', value: 'upgrade' },
                    { name: 'villain', value: 'villain' },
                )),
    async execute(context) {
        if (!Authorized(context)) return;

        try {
            let command = `/card`;
            let origin = context.options.getString('origin');
            
            let authorOption = context.options.getMentionable('author');
            let author = authorOption ? authorOption.id : null;
            
            let classificationOption = context.options.getString('classification');
            let classification = classificationOption ? classificationOption.toLowerCase() : null;
            
            let cost = context.options.getString('cost');
            
            let nameOption = context.options.getString('name');
            let name = nameOption ? nameOption.toLowerCase() : null;
            
            let packOption = context.options.getString('pack');
            let packIds = packOption ? PackDao.RetrieveByNameLocally(packOption, origin).map(x => x.Id) : null;
            
            let resourceOption = context.options.getString('resource');
            let resource = resourceOption ? ResourceConverter[resourceOption.toLowerCase()] : null;
            
            let setOption = context.options.getString('set');
            let setIds = setOption ? SetDao.RetrieveByNameLocally(setOption, origin).map(x => x.Id) : null;
            
            let textOption = context.options.getString('text');
            let text = textOption ? textOption.toLowerCase() : null;

            let traitsOption = context.options.getString('traits');
            let traits = traitsOption ? traitsOption.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, '')) : null;
            
            let typeOption = context.options.getString('type');
            let type = typeOption ? typeOption.toLowerCase() : null;

            if (origin !== 'official' && context.guildId) {
                let restrictions = ConfigurationDao.CONFIGURATION.UnofficialRestrictions[context.guildId];

                if (restrictions && !restrictions.includes(context.channelId)) {
                    SendContentAsEmbed(context, `Unofficial content queries are restricted to the following channel${restrictions.length > 1 ? 's' : ''}:${restrictions.map(x => `\n<#${x}>`).join('')}`, null, true);
                    return;
                }
            }
            
            if (!classification && !author && !cost && !name && !packIds && !resource && !setIds && !text && !traits && !type) {
                SendContentAsEmbed(context, 'You must specify at least one search criteria...', null, true);
                return;
            }

            new Promise(() => LogCommand(context, command, null));

            let results = [];

            if ((packOption && packIds.length === 0) || (setOption && setIds.length === 0)) {
                results = [];
            }
            else {
                if (name) {
                    if (!name.match(/([a-z0-9])/gi)) {
                        SendContentAsEmbed(context, `${inlineCode(name)} is not a valid query...`);
                        return;
                    }
    
                    results = await CardDao.RetrieveByName(name, origin);
    
                    if (results) {
                        if (author) results = results.filter(card => card.AuthorId === author);
                        if (classification) {
                            if (classification === 'aspect') {
                                results = results.filter(card => card.Classification.toLowerCase() !== 'encounter' && card.Classification.toLowerCase() !== 'hero');
                            }
                            else if (classification === 'player') {
                                results = results.filter(card => card.Classification.toLowerCase() !== 'encounter');
                            }
                            else {
                                results = results.filter(card => card.Classification.toLowerCase() === classification);
                            }
                        }
                        if (cost) results = results.filter(card => card.Cost && card.Cost.toLowerCase() === cost);
                        if (packIds) {
                            results = results.filter(card => card.Printings.some(printing => packIds.includes(printing.PackId)));
                        }
                        if (resource) {
                            if (resource === 'none') {
                                results = results.filter(card => !card.Resource);
                            }
                            else {
                                results = results.filter(card => card.Resource && card.Resource.toLowerCase().includes(ResourceConverter[resource]));
                            }
                        }
                        if (setIds) {
                            results = results.filter(card => card.Printings.some(printing => setIds.includes(printing.SetId)));
                        }
                        if (text) results = results.filter(card => (card.Rules && card.Rules.toLowerCase().includes(text)) || (card.Special && card.Special.toLowerCase().includes(text)));
                        if (traits) results = results.filter(card => card.Traits && traits.every(element => card.Traits.find(trait => trait.toLowerCase() === element.trim())));
                        if (type) results = results.filter(card => card.Type.toLowerCase() === type);
                    }
                }
                else {
                    results = await CardDao.RetrieveWithFilters(origin, author, null, classification, cost, null, packIds, resource, setIds, text, traits, type);
                }
            }
            
            if (!results || results.length === 0) SendContentAsEmbed(context, 'No results were found for the given query...');
            else if (results.length === 1) QueueCardResult(context, results[0]);
            else if (results.length > 1) SelectBox(context, results);
        }
        catch (e) {
            ReportError(context, e);
        }
    }
}