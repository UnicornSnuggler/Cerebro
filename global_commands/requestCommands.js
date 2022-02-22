const { SlashCommandBuilder } = require('@discordjs/builders');
const { LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, Authorized } = require('../utilities/messageHelper');
const { DAY_MILLIS, COLORS } = require('../constants');
const { ProcessRequest, DATA_QUESTIONS, FEATURE_QUESTIONS, BuildEntity, FLAG_TYPES, BuildRequestListEmbed, SendRequestEmbed } = require('../utilities/requestHelper');
const { RequestDao } = require('../dao/requestDao');
const { ConfigurationDao } = require('../dao/configurationDao');
const { ReportError } = require('../utilities/errorHelper');

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
                        .addChoice('all', 'all')
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
                        .addChoice('feature', 'feature')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('review')
                .setDescription('Review pending requests — or re-review previously reviewed requests.')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('The ID of the request you want to review — or re-review.')
                        .setRequired(true))),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            let subCommand = context.options.getSubcommand();
            let idOption = context.options.getString('id');
            let moderator = ConfigurationDao.CONFIGURATION.Moderators.includes(context.user.id);
            let scopeOption = context.options.getString('scope');
            let typeOption = context.options.getString('type');
            let command = `/request`;

            new Promise(() => LogCommand(context, command, null));

            if (subCommand === 'list') {
                let requests = [];

                if (scopeOption === 'all') {
                    requests = await RequestDao.RetrieveAllRequests(typeOption);

                    if (requests && requests.length > 0) {
                        if (!moderator) {
                            requests = requests.filter(x => x.UserId === context.user.id || [FLAG_TYPES.approved, FLAG_TYPES.inProgress].includes(x.Flag));
                        }
                        else {
                            requests = requests.filter(x => x.UserId === context.user.id || [FLAG_TYPES.pendingReview, FLAG_TYPES.approved, FLAG_TYPES.inProgress].includes(x.Flag));
                        }
                    }
                }
                else {
                    requests = await RequestDao.RetrieveRequestsByUserId(context.user.id, typeOption);
                }

                const embed = BuildRequestListEmbed(requests, typeOption, scopeOption);

                await context.reply({
                    embeds: [embed],
                    ephemeral: moderator || scopeOption !== 'all'
                });
            }
            else if (subCommand === 'new') {
                await context.deferReply({ephemeral: true});

                let requests = await RequestDao.RetrieveRequestsByUserId(context.user.id, 'all');
                
                if (requests !== null) {
                    requests.sort((a, b) => { return b.Timestamp - a.Timestamp; });
                    
                    if (requests.filter(x => x.Flag === FLAG_TYPES.banished).length > 0) {
                        let replyEmbed = CreateEmbed('Because one of your previous requests was flagged as inappropriate, improper, or otherwise unsavory, you are banned from making future requests.\n\nYou may appeal this decision if you feel an error was made.', COLORS.Aggression);

                        await context.editReply({
                            embeds: [replyEmbed],
                            ephemeral: true
                        });

                        return;
                    }
                    else if (requests.filter(x => x.Type === typeOption && x.Flag === FLAG_TYPES.pendingReview && Date.now() - x.Timestamp < DAY_MILLIS).length > 0) {
                        let replyEmbed = CreateEmbed('You cannot make another request until your previously submitted request is approved or has been pending for 24 hours.', COLORS.Justice);

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

                ProcessRequest(context, requestEntity, dmChannel, context.user, questionSet);

                let replyEmbed = CreateEmbed(context.guildId ? 'Check your DMs!' : 'Subroutine initiated!');

                await context.editReply({
                    embeds: [replyEmbed],
                    ephemeral: true
                });
            }
            else if (subCommand === 'review') {
                await context.deferReply({ephemeral: true});

                let requests = await RequestDao.RetrieveRequestById(idOption);

                if (requests) {
                    if (requests.length > 1) {
                        let replyEmbed = CreateEmbed('Multiple requests with the provided ID were found...');
        
                        await context.editReply({
                            embeds: [replyEmbed],
                            ephemeral: true
                        });

                        return;
                    }
                    
                    let owner = requests[0].UserId === context.user.id;
                    await SendRequestEmbed(context, requests[0], moderator, owner);

                    let replyEmbed = CreateEmbed(context.guildId ? 'Check your DMs!' : 'Subroutine initiated!');
    
                    await context.editReply({
                        embeds: [replyEmbed],
                        ephemeral: true
                    });
                }
                else {
                    let replyEmbed = CreateEmbed('No request with the provided ID was found...');
    
                    await context.editReply({
                        embeds: [replyEmbed],
                        ephemeral: true
                    });
                }
            }
        }
        catch (e) {
            ReportError(context, e);
        }
    }
}