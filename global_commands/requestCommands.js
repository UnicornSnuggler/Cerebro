const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { RuleDao } = require('../dao/ruleDao');
const { LogCommand, LogRuleResult } = require('../utilities/logHelper');
const { CreateEmbed, RemoveComponents, SendContentAsEmbed, SendMessageWithOptions, Authorized } = require('../utilities/messageHelper');
const { BuildEmbed } = require('../utilities/ruleHelper');
const { SYMBOLS, INTERACT_APOLOGY, LOAD_APOLOGY, SELECT_TIMEOUT, DAY_MILLIS, COLORS } = require('../constants');
const { ProcessRequest, DATA_QUESTIONS, FEATURE_QUESTIONS, BuildEntity, FLAG_TYPES } = require('../utilities/requestHelper');
const { RequestEntity } = require('../models/requestEntity');
const { RequestDao } = require('../dao/requestDao');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription('Requests for new data and features to be added.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all of the requests of a given type.')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Whether to list data requests or feature requests.')
                        .setRequired(true)
                        .addChoice('data', 'data')
                        .addChoice('feature', 'feature'))
                .addStringOption(option =>
                    option
                        .setName('scope')
                        .setDescription('Whether to list all requests or just your own.')
                        .setRequired(true)
                        .addChoice('all', 'all')
                        .addChoice('personal', 'personal')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('new')
                .setDescription('Make a new request.')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Whether to make a new data request or a new feature request.')
                        .setRequired(true)
                        .addChoice('data', 'data')
                        .addChoice('feature', 'feature'))),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            let subCommand = context.options.getSubcommand();
            let typeOption = context.options.getString('type');
            let command = `/request`;

            new Promise(() => LogCommand(context, command, null));

            if (subCommand === 'list') {
                SendContentAsEmbed(context, 'Not yet implemented; coming soon!');
                return;
            }
            else {
                await context.deferReply({ephemeral: true});

                let requests = await RequestDao.RetrieveRequestsByUserId(context.user.id, typeOption);
                
                if (requests !== null) {
                    requests.sort((a, b) => { return b.Timestamp - a.Timestamp; });
                    
                    if (requests.filter(x => x.Flag === FLAG_TYPES.disrespectfullyDenied).length > 0) {
                        let replyEmbed = CreateEmbed('Because one of your previous requests was flagged as inappropriate, improper, or otherwise unsavory, you are banned from making future requests.\n\nYou may appeal this decision if you feel an error was made.', COLORS.Aggression);

                        await context.editReply({
                            embeds: [replyEmbed],
                            ephemeral: true
                        });

                        return;
                    }
                    else if (requests.filter(x => x.Flag === FLAG_TYPES.pendingReview && Date.now() - x.Timestamp < DAY_MILLIS).length > 0) {
                        let replyEmbed = CreateEmbed('You cannot make another request until your previously pending request is approved or has been pending for 24 hours.', COLORS.Justice);

                        await context.editReply({
                            embeds: [replyEmbed],
                            ephemeral: true
                        });

                        return;
                    }
                }

                let dmChannel = await context.user.createDM();
                let questionSet = typeOption === 'data' ? DATA_QUESTIONS : FEATURE_QUESTIONS;

                let requestEntity = BuildEntity(context.user.id, typeOption);

                ProcessRequest(requestEntity, dmChannel, context.user, questionSet);

                let replyEmbed = CreateEmbed(context.guildId ? 'Check your DMs!' : 'Subroutine initiated!');

                await context.editReply({
                    embeds: [replyEmbed],
                    ephemeral: true
                });
            }
        }
        catch (e) {
            console.log(e);

            let replyEmbed = CreateEmbed('Something went wrong... Check the logs to find out more.');

            await context.editReply({
                embeds: [replyEmbed],
                ephemeral: true
            });
        }
    }
}