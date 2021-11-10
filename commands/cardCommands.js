const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { CardDao } = require('../dao/cardDao');
const { PackDao } = require('../dao/packDao');
const { FindUniqueArts, GetPrintingByArtificialId, Imbibe } = require('../utilities/cardHelper');
const { LogCardResult, LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed } = require('../utilities/messageHelper');
const { SYMBOLS, LOAD_APOLOGY, INTERACT_APOLOGY } = require('../constants');

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

const QueueCardResult = async function(context, card, message = null) {
    LogCardResult(context, card);

    let collection = await CardDao.FindFacesAndStages(card);

    let expandedCard = collection.cards.find(x => x.Id === card.Id);
    let currentArtStyle = FindUniqueArts(card).indexOf(card.Id);
    let currentFace = collection.faces.length > 0 ? collection.faces.findIndex(x => x === expandedCard.Id) : -1;
    let currentStage = collection.elements.length > 0 ? collection.elements.findIndex(x => x.cardId === expandedCard.Id) : -1;

    Imbibe(context, expandedCard, currentArtStyle, currentFace, currentStage, collection, false, false, message);
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
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true))))
        .addSubcommandGroup(subcommand =>
            subcommand
                .setName('unofficial')
                .setDescription('Query an unofficial card.')
                .addSubcommand(subsubcommand => 
                    subsubcommand
                        .setName('name')
                        .setDescription('Query a card by its title and subtitle.')
                        .addStringOption(option => option.setName('terms').setDescription('The term(s) being queried.').setRequired(true)))),
    async execute(context) {
        try {
            let subCommand = context.options.getSubcommand();
            let subCommandGroup = context.options.getSubcommandGroup();
            let command = `/card ${subCommandGroup} ${subCommand}`;

            if (subCommand === 'name') {
                let terms = context.options.getString('terms');

                LogCommand(context, command, terms);

                let official = subCommandGroup === 'official';
    
                let results = await CardDao.RetrieveByName(terms, official);
                
                if (!results || results.length === 0) SendContentAsEmbed(context, 'No results were found for the given query...');
                else if (results.length === 1) QueueCardResult(context, results[0]);
                else if (results.length > 1) SelectBox(context, results);
            }
            else SendContentAsEmbed(context, 'Something weird happened...');
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(context, 'Something went wrong... Check the logs to find out more.');
        }
    }
}