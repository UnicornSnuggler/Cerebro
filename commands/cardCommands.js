const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { GroupDao } = require('../dao/groupDao');
const { BuildEmbed, BuildCardImagePath, BuildRulesEmbed, EvaluateRules, FindUniqueArts, GetPrintingByArtificialId } = require('../utilities/cardHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, SendMessageWithOptions } = require('../utilities/messageHelper');
const { SYMBOLS, LOAD_APOLOGY, INTERACT_APOLOGY } = require('../constants');
const { SetDao } = require('../dao/setDao');
const { PackDao } = require('../dao/packDao');

const SelectBox = async function(interaction, cards) {
    let selector = new MessageSelectMenu()
        .setCustomId('selector')
        .setPlaceholder('No card selected...');

    let prompt = `${cards.length} results were found for the given query!`;

    if (cards.length > 25) {
        cards = cards.slice(0, 25);
        prompt += ' Only the top 25 results could be shown.';
    }

    prompt += '\n\nPlease select from the following...';
    
    for (let card of cards) {
        let description = card.Type;
        let packId = GetPrintingByArtificialId(card, card.Id).PackId ?? null;
        
        if (packId) {
            let pack = PackDao.PACKS.find(x => x.Id === packId);

            if (card.Classification === 'Hero' && !['Alter-Ego', 'Hero'].includes(card.Type)) description = `${pack.Name} ${description}`;
            else if (card.Classification === 'Encounter') description = `${description} (${pack.Name})`;
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

    let components = new MessageActionRow().addComponents(selector);

    let promise = SendContentAsEmbed(interaction, prompt, [components]);
    
    promise.then((message) => {
        let collector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 10000 });

        collector.on('collect', async i => {
            if (i.user.id === interaction.member.id) {
                let card = cards.find(x => x.Id === i.values[0]);

                collector.stop('selection');

                i.deferUpdate()
                .then(() => {
                    QueueCardResult(interaction, card, message);
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

const Imbibe = function(interaction, card, currentArtStyle, currentFace, currentStage, collection, rulesToggle, artToggle, message = null) {
    let navigationRow = new MessageActionRow();

    let artStyles = FindUniqueArts(card);

    if (artStyles.length > 1)
        navigationRow.addComponents(new MessageButton()
            .setCustomId('cycleArt')
            .setLabel('Change Art')
            .setStyle('PRIMARY'));

    if (collection.faces.length > 0)
        navigationRow.addComponents(new MessageButton()
            .setCustomId('cycleFace')
            .setLabel('Flip Card')
            .setStyle('PRIMARY'));

    if (collection.stages.length > 0) {
        navigationRow.addComponents(new MessageButton()
            .setCustomId('previousStage')
            .setLabel('Previous Stage')
            .setStyle('PRIMARY'));
        
        navigationRow.addComponents(new MessageButton()
            .setCustomId('nextStage')
            .setLabel('Next Stage')
            .setStyle('PRIMARY'));
    }

    let toggleRow = new MessageActionRow();

    if (EvaluateRules(card))
        toggleRow.addComponents(new MessageButton()
            .setCustomId('toggleRules')
            .setLabel('Toggle Rules')
            .setStyle('SECONDARY'));

    toggleRow.addComponents(new MessageButton()
        .setCustomId('toggleArt')
        .setLabel('Toggle Art')
        .setStyle('SUCCESS'));

    toggleRow.addComponents(new MessageButton()
        .setCustomId('clearComponents')
        .setLabel('Clear Buttons')
        .setStyle('DANGER'));

    let promise;

    let artificialId = artStyles[currentArtStyle];

    let components = [];
    let embeds = [];
    let files = [];
    
    for (let row of [navigationRow, toggleRow]) {
        if (row.components.length > 0) components.push(row);
    }

    if (!artToggle) {
        if (!rulesToggle) embeds.push(BuildEmbed(card, artificialId));
        else embeds.push(BuildRulesEmbed(card, artificialId));
    }
    else {
        let printing = GetPrintingByArtificialId(card, artificialId);
        let set = SetDao.SETS.find(x => x.Id === printing.SetId);

        files.push({
            attachment: BuildCardImagePath(card, artificialId),
            name: `${(card.Incomplete || set.Incomplete) ? 'SPOILER_' : ''}${artificialId}.png`,
            spoiler: card.Incomplete
        });
    }

    let messageOptions = {
        components: components,
        embeds: embeds,
        files: files
    };

    if (message) promise = message.edit(messageOptions);
    else promise = SendMessageWithOptions(interaction, messageOptions);
        
    promise.then((message) => {
        const collector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000 });

        collector.on('collect', i => {
            if (i.user.id === interaction.member.id) {
                if (i.customId != 'clearComponents') collector.stop('navigation');

                i.deferUpdate()
                .then(async () => {
                    let nextArtStyle = currentArtStyle;
                    let nextCard = card;
                    let nextFace = currentFace;
                    let nextStage = currentStage;
                    let nextCollection = collection;
                    let nextRulesToggle = rulesToggle;
                    let nextArtToggle = artToggle;

                    switch (i.customId) {
                        case 'cycleArt':
                            nextArtStyle = currentArtStyle + 1 >= artStyles.length ? 0 : currentArtStyle + 1;

                            break;
                        case 'cycleFace':
                            nextArtStyle = 0;
                            nextFace = currentFace + 1 >= nextCollection.faces.length ? 0 : currentFace + 1;
                            nextCard = nextCollection.cards.find(x => x.Id === nextCollection.faces[nextFace]);
                            nextRulesToggle = false;
                            
                            if (nextCollection.stages) nextStage = nextCollection.stages.findIndex(x => x.cardId === nextCard.Id);

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
            else i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true});
        });

        collector.on('end', (i, reason) => {
            let content = null;
            let removeFiles = true;

            if (reason === 'navigation') content = LOAD_APOLOGY;
            else removeFiles = !artToggle;
            
            RemoveComponents(message, content, removeFiles);
        });
    });
}

const QueueCardResult = async function(interaction, card, message = null) {
    let collection = await CardDao.FindFacesAndStages(card);

    let expandedCard = collection.cards.find(x => x.Id === card.Id);
    let currentArtStyle = FindUniqueArts(card).indexOf(card.Id);
    let currentFace = collection.faces.length > 0 ? collection.faces.findIndex(x => x === expandedCard.Id) : -1;
    let currentStage = collection.stages.length > 0 ? collection.stages.findIndex(x => x.cardId === expandedCard.Id) : -1;

    Imbibe(interaction, expandedCard, currentArtStyle, currentFace, currentStage, collection, false, false, message);
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
                        .setDescription('Query a card by its title and subtitle.')
                        .addStringOption(option => option.setName('terms').setDescription('The terms being queried.').setRequired(true))))
        .addSubcommandGroup(subcommand =>
            subcommand
                .setName('unofficial')
                .setDescription('Query an unofficial card.')
                .addSubcommand(subsubcommand => 
                    subsubcommand
                        .setName('name')
                        .setDescription('Query a card by its title and subtitle.')
                        .addStringOption(option => option.setName('terms').setDescription('The terms being queried.').setRequired(true)))),
    async execute(interaction) {
        try {
            if (interaction.options.getSubcommand() === 'name') {
                let official = interaction.options.getSubcommandGroup() === 'official';
                let terms = interaction.options.getString('terms');
    
                let results = await CardDao.RetrieveByName(terms, official);
                
                if (!results || results.length === 0) SendContentAsEmbed(interaction, 'No results were found for the given query...');
                else if (results.length === 1) QueueCardResult(interaction, results[0]);
                else if (results.length > 1) SelectBox(interaction, results);
            }
            else if (interaction.options.getSubcommand() === 'textbox') SendContentAsEmbed(interaction, 'Not yet implemented... Sit tight!');
            else SendContentAsEmbed(interaction, 'Something weird happened...');
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(interaction, 'Something went wrong... Check the logs to find out more.');
        }
    }
}