const { SlashCommandBuilder } = require('@discordjs/builders');
const { CardResultLogEntity } = require('../models/cardResultLogEntity');
const { CollectionResultLogEntity } = require('../models/collectionResultLogEntity');
const { CommandLogEntity } = require('../models/commandLogEntity');
const { RuleResultLogEntity } = require('../models/ruleResultLogEntity');
const { LogDao } = require('../dao/logDao');
const { BuildCardResultsEmbed, BuildSetResultsEmbed, BuildPackResultsEmbed, BuildUserResultsEmbed } = require('../utilities/logHelper');
const { SendMessageWithOptions, CreateEmbed, Authorized } = require('../utilities/messageHelper');
const { DM_APOLOGY, STATISTICS_APOLOGY } = require('../constants');
const { ReportError } = require('../utilities/errorHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statistics')
        .setDescription('View command and result statistics.')
        .addStringOption(option => 
            option.setName('scale')
            .setDescription('The scale of the statistics you\'d like to view.')
            .setRequired(true)
			.addChoice('server', 'server')
			.addChoice('global', 'global')
			.addChoice('personal', 'personal'))
        .addStringOption(option => 
            option.setName('timeframe')
            .setDescription('The age of the statistics you\'d like to view.')
            .setRequired(true)
            .addChoice('daily', 'daily')
            .addChoice('weekly', 'weekly')
            .addChoice('monthly', 'monthly')
            .addChoice('yearly', 'yearly')
            .addChoice('all-time', 'all-time'))
        .addStringOption(option => 
            option.setName('type')
            .setDescription('The type of statistics you\'d like to view.')
            .setRequired(true)
			.addChoice('cards', 'cards')
			.addChoice('packs', 'packs')
			.addChoice('sets', 'sets')
			.addChoice('users', 'users')),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            let scale = context.options.getString('scale');
            let timeframe = context.options.getString('timeframe');
            let type = context.options.getString('type');

            if (scale === 'server' && !context.guildId) {
                SendMessageWithOptions(context, { embeds: [CreateEmbed(DM_APOLOGY)] });
                return;
            }
            
            let message = await SendMessageWithOptions(context, { embeds: [CreateEmbed(STATISTICS_APOLOGY)] });

            let map = {
                'cards': `all${CardResultLogEntity.COLLECTION}`,
                'packs': `all${CollectionResultLogEntity.COLLECTION}`,
                'rules': `all${RuleResultLogEntity.COLLECTION}`,
                'sets': `all${CollectionResultLogEntity.COLLECTION}`,
                'users': `all${CommandLogEntity.COLLECTION}`
            };

            let index = map[type];

            let results;

            let factor = null;
            let day = 86400000;

            switch (timeframe) {
                case 'daily':
                    factor = day;
                    break;
                case 'weekly':
                    factor = day * 7;
                    break;
                case 'monthly':
                    factor = day * 30;
                    break;
                case 'yearly':
                    factor = day * 365;
                    break;
                case 'yearly':
                    factor = day * 365;
                    break;
            }

            let cutoff = factor ? Date.now() - factor : 0;

            if (scale === 'personal') results = await LogDao.RetrieveLogs(index, cutoff, null, context.user.id);
            else if (scale === 'server') results = await LogDao.RetrieveLogs(index, cutoff, context.guildId);
            else if (scale === 'global') results = await LogDao.RetrieveLogs(index, cutoff);

            let embeds = [];

            if (type === 'cards') {
                embeds.push(await BuildCardResultsEmbed(results, scale, timeframe));
            }
            else if (type === 'packs') {
                embeds.push(BuildPackResultsEmbed(results, scale, timeframe));
            }
            else if (type === 'sets') {
                embeds.push(BuildSetResultsEmbed(results, scale, timeframe));
            }
            else if (type === 'users') {
                embeds.push(BuildUserResultsEmbed(results, scale, timeframe));
            }

            message.edit({ embeds: embeds });
        }
        catch (e) {
            ReportError(context, e);
        }
    }
}