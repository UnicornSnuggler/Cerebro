const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, inlineCode, ComponentType } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { FindUniqueArts, Imbibe, CreateSelectBox, QueueCompiledResult, BuildCollectionFromBatch } = require('../utilities/cardHelper');
const { LogCardResult, LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');
const { LOAD_APOLOGY, INTERACT_APOLOGY, SELECT_TIMEOUT, SECOND_MILLIS, DEFAULT_ART_TOGGLE } = require('../constants');
const { ReportError } = require('../utilities/errorHelper');
const { GetUserIdFromContext } = require('../utilities/userHelper');
const { ValidateQuerySyntax } = require('../utilities/queryHelper');

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
        .setName('query')
        .setDescription('Query cards with an advanced query language.')
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('The query string.')
                .setRequired(true))
        .addBooleanOption(option =>
            option
                .setName('validate')
                .setDescription('Whether to execute the query or merely evaluate it.')
                .setRequired(false)),
    async execute(context) {
        if (!Authorized(context)) return;

        try {
            let command = `/query`;
            let input = context.options.getString('input');
            let validate = context.options.getBoolean('validate');
            
            new Promise(() => LogCommand(context, command, null));

            let validation = ValidateQuerySyntax(input);

            if (!validation.result) {
                SendContentAsEmbed(context, validation.output, null, true);
                return;
            }
            else if (validate) {
                SendContentAsEmbed(context, `Your query was successfully validated! The trimmed and formatted rendition is as follows:\n\`\`\`${validation.output}\`\`\``, null, true);
                return;
            }
    
            results = await CardDao.RetrieveWithAdvancedQueryLanguage(validation.output);
            
            if (!results || results.length === 0) SendContentAsEmbed(context, 'No results were found for the given query...');
            else if (results.length === 1) QueueCardResult(context, results[0]);
            else if (results.length > 1) SelectBox(context, results);
        }
        catch (e) {
            ReportError(context, e);
        }
    }
}