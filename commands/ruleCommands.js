const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { RuleDao } = require('../dao/ruleDao');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, SendMessageWithOptions } = require('../utilities/messageHelper');
const { BuildEmbed } = require('../utilities/ruleHelper');
const { SYMBOLS, INTERACT_APOLOGY, LOAD_APOLOGY } = require('../constants');

const SelectBox = async function(interaction, rules) {
    var selector = new MessageSelectMenu()
        .setCustomId('selector')
        .setPlaceholder('No rule selected...');

    var prompt = `${rules.length} results were found for the given query!`;

    if (rules.length > 25) {
        rules = rules.slice(0, 25);
        prompt += ' Only the top 25 results could be shown below.';
    }

    prompt += '\n\nPlease select from the following...';
    
    for (var rule of rules) {
        var emoji = null;
        var emojiMatch = rule.Title.match(/ \((\{[a-z]\})\)/i);

        var title = rule.Title;
        var description = rule.Reference ?? null;

        if (emojiMatch) {
            emoji = SYMBOLS[emojiMatch[1]];

            title = title.replace(emojiMatch[0], '');
            if (description) description = description.replace(emojiMatch[0], '');
        }
        
        selector.addOptions([{
            description: description ? `${description.substring(0, 50)}...` : '',
            emoji: emoji,
            label: title,
            value: rule.Id
        }]);
    }

    var components = new MessageActionRow().addComponents(selector);

    promise = SendContentAsEmbed(interaction, prompt, [components]);
    
    promise.then((message) => {
        const collector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 15000 });

        collector.on('collect', async i => {
            if (i.user.id === interaction.member.id) {
                var rule = rules.find(x => x.Id === i.values[0]);
    
                collector.stop('selection');
    
                i.deferUpdate()
                    .then(() => {
                        var embed = BuildEmbed(rule);
        
                        var messageOptions = {
                            components: [],
                            embeds: [embed]
                        };
        
                        message.edit(messageOptions);
                    });
            }
            else i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
        });

        collector.on('end', (i, reason) => {
            var content = 'The timeout was reached...';

            if (reason === 'selection') content = LOAD_APOLOGY;
            
            RemoveComponents(message, content);
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Query Rules Reference entries.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Query a Rules Reference entry by its title.')
                .addBooleanOption(option => option.setName('official').setDescription('Is the entry being queried official?').setRequired(true))
                .addStringOption(option => option.setName('terms').setDescription('The terms being queried.').setRequired(true))),
    async execute(interaction) {
        try {
            if (interaction.options.getSubcommand() === 'title') {
                let official = interaction.options.getBoolean('official');
                let terms = interaction.options.getString('terms');
    
                var results = await RuleDao.RetrieveByTerm(terms, official);

                if (!results || results.length === 0) SendContentAsEmbed(interaction, 'No results were found for the given query...');
                else if (results.length === 1) SendMessageWithOptions(interaction, { embeds: [BuildEmbed(results[0])] });
                else if (results.length > 1) SelectBox(interaction, results);
            }
            else SendContentAsEmbed(interaction, 'Something weird happened...');
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(interaction, 'Something went wrong... Check the logs to find out more.');
        }
    }
}