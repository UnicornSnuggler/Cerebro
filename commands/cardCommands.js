const { SlashCommandBuilder } = require('@discordjs/builders');
const { CardDao } = require('../dao/cardDao');
const { GroupDao } = require('../dao/groupDao');
const MessageHelper = require('../utilities/messageHelper');
const CardHelper = require('../utilities/cardHelper');
const { BuildImagePath } = require('../utilities/stringHelper');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { SYMBOLS, LOAD_APOLOGY, INTERACT_APOLOGY } = require('../constants');

const SelectBox = async function(interaction, cards) {
    var selector = new MessageSelectMenu()
        .setCustomId('selector')
        .setPlaceholder('No card selected...');

    var prompt = `${cards.length} results were found for the given query!`;

    if (cards.length > 25) {
        cards = cards.slice(0, 25);
        prompt += ' Only the top 25 results could be shown.';
    }

    prompt += '\n\nPlease select from the following...';
    
    cards.forEach(card => {
        var group = card.Classification === 'Encounter' && card.Group ? GroupDao.GROUPS.find(x => x.Guid === card.Group) : null;
        var description = (card.Classification != 'Encounter' && card.Type != 'Hero' && card.Type != 'Alter-Ego' ? `${card.Classification} ` : '')
            + card.Type + (group ? ` (${group.Name.replace(` ${group.Type}`, '')})` : '');
        var emoji = null;

        if (card.Resource) emoji = SYMBOLS[card.Resource];

        selector.addOptions([{
            label: `${card.Name}${card.Subname ? ` (${card.Subname})` : ''}`,
            description: description,
            emoji: emoji,
            value: card.Id
        }])
    });

    var components = new MessageActionRow()
        .addComponents(selector);

    promise = MessageHelper.SendContentAsEmbed(interaction, prompt, [components]);
    
    promise.then((message) => {
        const collector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 10000 });

        collector.on('collect', async i => {
            if (i.user.id === interaction.member.id) {
                var card = cards.find(x => x.Id === i.values[0]);

                collector.stop('selection');

                i.deferUpdate()
                .then(() => {
                    QueueCardResult(interaction, card, message);
                });
            }
            else {
                i.reply({embeds: [MessageHelper.CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
            }
        });

        collector.on('end', (i, reason) => {
            var content = 'The timeout was reached...';

            if (reason === 'selection') content = LOAD_APOLOGY;
            
            MessageHelper.RemoveComponents(message, content);
        });
    });
}

const Imbibe = function(interaction, card, currentArtStyle, currentFace, currentStage, collection, rulesToggle, artToggle, message = null) {
    var navigationRow = new MessageActionRow();

    if (card.ArtStyles.length > 1) {
        navigationRow.addComponents(new MessageButton()
            .setCustomId('cycleArt')
            .setLabel('Change Art')
            .setStyle('PRIMARY')
        );
    }

    if (collection.faces.length > 0) {
        navigationRow.addComponents(new MessageButton()
            .setCustomId('cycleFace')
            .setLabel('Flip Card')
            .setStyle('PRIMARY')
        );
    }

    if (collection.stages.length > 0) {
        navigationRow.addComponents(new MessageButton()
            .setCustomId('previousStage')
            .setLabel('Previous Stage')
            .setStyle('PRIMARY')
        );
        
        navigationRow.addComponents(new MessageButton()
            .setCustomId('nextStage')
            .setLabel('Next Stage')
            .setStyle('PRIMARY')
        );
    }

    var toggleRow = new MessageActionRow();

    if (CardHelper.EvaluateRules(card)) {
        toggleRow.addComponents(new MessageButton()
            .setCustomId('toggleRules')
            .setLabel('Toggle Rules')
            .setStyle('SECONDARY')
        );
    }

    toggleRow.addComponents(new MessageButton()
        .setCustomId('toggleArt')
        .setLabel('Toggle Art')
        .setStyle('SUCCESS')
    );

    toggleRow.addComponents(new MessageButton()
        .setCustomId('clearComponents')
        .setLabel('Clear Buttons')
        .setStyle('DANGER')
    );

    var promise;

    var components = [];
    var embeds = [];
    var files = [];
    
    [navigationRow, toggleRow].forEach(row => {
        if (row.components.length > 0) components.push(row);
    });

    if (!artToggle) {
        if (!rulesToggle) {
            embeds.push(CardHelper.BuildEmbed(card, card.ArtStyles[currentArtStyle]));
        }
        else {
            embeds.push(CardHelper.BuildRulesEmbed(card, card.ArtStyles[currentArtStyle]));
        }
    }
    else {
        files.push({
            attachment: BuildImagePath(process.env.cardImagePrefix, card.ArtStyles[currentArtStyle]),
            name: `${card.Incomplete ? 'SPOILER_' : ''}${card.ArtStyles[currentArtStyle]}.png`,
            spoiler: card.Incomplete
        });
    }

    var messageOptions = {
        components: components,
        embeds: embeds,
        files: files
    };

    if (message) {
        promise = message.edit(messageOptions);
    }
    else {
        promise = MessageHelper.SendMessageWithOptions(interaction, messageOptions);
    }
        
    promise.then((message) => {
        const collector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000 });

        collector.on('collect', i => {
            if (i.user.id === interaction.member.id) {
                if (i.customId != 'clearComponents') collector.stop('navigation');

                i.deferUpdate()
                .then(async () => {
                    var nextArtStyle = currentArtStyle;
                    var nextCard = card;
                    var nextFace = currentFace;
                    var nextStage = currentStage;
                    var nextCollection = collection;
                    var nextRulesToggle = rulesToggle;
                    var nextArtToggle = artToggle;

                    switch (i.customId) {
                        case 'cycleArt':
                            nextArtStyle = currentArtStyle + 1 >= card.ArtStyles.length ? 0 : currentArtStyle + 1;

                            break;
                        case 'cycleFace':
                            nextArtStyle = 0;
                            nextFace = currentFace + 1 >= nextCollection.faces.length ? 0 : currentFace + 1;
                            nextCard = nextCollection.cards.find(x => x.Id === nextCollection.faces[nextFace]);
                            nextRulesToggle = false;
                            
                            if (nextCollection.stages) {
                                nextStage = nextCollection.stages.findIndex(x => x.cardId === nextCard.Id);
                            }

                            break;
                        case 'previousStage':
                            nextArtStyle = 0;
                            nextStage = currentStage - 1 >= 0 ? currentStage - 1 : nextCollection.stages.length - 1;
                            nextCard = nextCollection.cards.find(x => x.Id === nextCollection.stages[nextStage].cardId);
                            nextRulesToggle = false;
                            
                            if (nextCollection.stages[nextStage].faces) {
                                nextCollection.faces = nextCollection.stages[nextStage].faces;
                                nextFace = nextCollection.faces.findIndex(x => x === nextCard.Id);
                            }
                            
                            break;
                        case 'nextStage':
                            nextArtStyle = 0;
                            nextStage = currentStage + 1 >= nextCollection.stages.length ? 0 : currentStage + 1;
                            nextCard = nextCollection.cards.find(x => x.Id === nextCollection.stages[nextStage].cardId);
                            nextRulesToggle = false;
                            
                            if (nextCollection.stages[nextStage].faces) {
                                nextCollection.faces = nextCollection.stages[nextStage].faces;
                                nextFace = nextCollection.faces.findIndex(x => x === nextCard.Id);
                            }
                            
                            break;
                        case 'toggleRules':
                            nextRulesToggle = !rulesToggle;
                            nextArtToggle = false;

                            break;
                        case 'toggleArt':
                            nextRulesToggle = false;
                            nextArtToggle = !nextArtToggle;

                            break;
                        case 'clearComponents':
                            collector.stop('cancellation');
                            return;
                        default:
                            break;
                    }

                    Imbibe(interaction, nextCard, nextArtStyle, nextFace, nextStage, nextCollection, nextRulesToggle, nextArtToggle, message);
                });
            }
            else {
                i.reply({embeds: [MessageHelper.CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
            }
        });

        collector.on('end', (i, reason) => {
            var content = null;
            var removeFiles = true;

            if (reason === 'navigation') {
                content = LOAD_APOLOGY;
            }
            else {
                removeFiles = !artToggle;
            }
            
            MessageHelper.RemoveComponents(message, content, removeFiles);
        });
    });
};

const QueueCardResult = async function(interaction, card, message = null) {
    var collection = await CardDao.FindFacesAndStages(card);

    var expandedCard = collection.cards.find(x => x.Id === card.Id);
    var currentFace = collection.faces.length > 0 ? collection.faces.findIndex(x => x === expandedCard.Id) : -1;
    var currentStage = collection.stages.length > 0 ? collection.stages.findIndex(x => x.cardId === expandedCard.Id) : -1;

    Imbibe(interaction, expandedCard, 0, currentFace, currentStage, collection, false, false, message);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Query cards.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('name')
                .setDescription('Query a card by its title and subtitle.')
                .addStringOption(option => option.setName('terms').setDescription('The terms being queried.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('textbox')
                .setDescription('Query a card by the text in its textbox.')
                .addStringOption(option => option.setName('terms').setDescription('The terms being queried.').setRequired(true))),
    async execute(interaction) {
        try {
            if (interaction.options._subcommand === 'name') {
                terms = interaction.options._hoistedOptions.find(x => { return x.name === 'terms'; }).value;
    
                var results = await CardDao.RetrieveByName(terms);
                
                if (!results || results.length === 0) {
                    MessageHelper.SendContentAsEmbed(interaction, 'No results were found for the given query...');
                }
                else if (results.length === 1) {
                    var card = results[0];

                    QueueCardResult(interaction, card);
                }
                else if (results.length > 1) {
                    SelectBox(interaction, results);
                }
            }
            else if (interaction.options._subcommand === 'textbox') {
                MessageHelper.SendContentAsEmbed(interaction, 'Not yet implemented... Sit tight!');
            }
            else {
                MessageHelper.SendContentAsEmbed(interaction, 'Something weird happened...');
            }
        }
        catch (e) {
            console.log(e);
            MessageHelper.SendContentAsEmbed(interaction, 'Something went wrong... Check the logs to find out more.');
        }
    }
};