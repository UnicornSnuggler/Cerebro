const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { RuleDao } = require('../dao/ruleDao');
const { LogCommand, LogRuleResult } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, SendMessageWithOptions, Authorized } = require('../utilities/messageHelper');
const { BuildEmbed } = require('../utilities/ruleHelper');
const { SYMBOLS, INTERACT_APOLOGY, LOAD_APOLOGY, SELECT_TIMEOUT, TIMEOUT_APOLOGY } = require('../constants');

const SelectBox = async function(context, rules) {
    let selector = new MessageSelectMenu()
        .setCustomId('selector')
        .setPlaceholder('No rule selected...');

    let prompt = `${rules.length} results were found for the given query!`;

    if (rules.length > 25) {
        rules = rules.slice(0, 25);
        prompt += ' Only the top 25 results could be shown below.';
    }

    prompt += '\n\nPlease select from the following...';
    
    for (let rule of rules) {
        let emoji = null;
        let emojiMatch = rule.Title.match(/ \((\{[a-z]\})\)/i);

        let title = rule.Title;
        let description = rule.Reference ?? null;

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

    let components = new MessageActionRow().addComponents(selector);

    promise = SendContentAsEmbed(context, prompt, [components]);
    
    promise.then((message) => {
        const collector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: SELECT_TIMEOUT * 1000 });

        collector.on('collect', async i => {
            let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;

            if (i.user.id === userId) {
                let rule = rules.find(x => x.Id === i.values[0]);

                new Promise(() => LogRuleResult(i, rule));
    
                collector.stop('selection');
    
                i.deferUpdate()
                    .then(() => {
                        let embed = BuildEmbed(rule);
        
                        let messageOptions = {
                            components: [],
                            embeds: [embed]
                        };
        
                        message.edit(messageOptions);
                    });
            }
            else i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
        });

        collector.on('end', (i, reason) => {
            let content = TIMEOUT_APOLOGY;

            if (reason === 'selection') content = LOAD_APOLOGY;
            
            RemoveComponents(message, content);
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rule')
        .setDescription('Query rules.')
        .addStringOption(option =>
            option
                .setName('origin')
                .setDescription('The origin of the rule.')
                .setRequired(true)
                .addChoice('official', 'official')
                .addChoice('unofficial', 'unofficial')
                .addChoice('all', 'all'))
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription('Query an official Rules Reference entry by its title.')
                .setRequired(true)),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            let origin = context.options.getString('origin');
            let titleOption = context.options.getString('title');
            let command = `/rule`;

            new Promise(() => LogCommand(context, command, null));

            let results = await RuleDao.RetrieveByTerm(titleOption, origin);

            if (!results || results.length === 0) SendContentAsEmbed(context, 'No results were found for the given query...');
            else if (results.length === 1) {
                let rule = results[0];

                new Promise(() => LogRuleResult(context, rule));

                SendMessageWithOptions(context, { embeds: [BuildEmbed(rule)] });
            }
            else if (results.length > 1) SelectBox(context, results);
        }
        catch (e) {
            console.log(e);

            let replyEmbed = CreateEmbed('Something went wrong... Check the logs to find out more.');

            await context.channel.send({
                embeds: [replyEmbed]
            });
        }
    }
}