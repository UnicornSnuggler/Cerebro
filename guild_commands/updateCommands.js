const { SlashCommandBuilder } = require('@discordjs/builders');
const { AuthorDao } = require('../dao/authorDao');
const { ConfigurationDao } = require('../dao/configurationDao');
const { FormattingDao } = require('../dao/formattingDao');
const { GroupDao } = require('../dao/groupDao');
const { PackDao } = require('../dao/packDao');
const { RuleDao } = require('../dao/ruleDao');
const { SetDao } = require('../dao/setDao');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update locally stored lists.')
        .addStringOption(option =>
            option.setName('list')
                .setDescription('The list to be updated.')
                .setRequired(true)
                .addChoice('All', 'all')
                .addChoice('Authors', 'authors')
                .addChoice('Configuration', 'configuration')
                .addChoice('Formattings', 'formattings')
                .addChoice('Groups', 'groups')
                .addChoice('Packs', 'packs')
                .addChoice('Rules', 'rules')
                .addChoice('Sets', 'sets')),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            switch (context.options.getString('list')) {
                case 'all':
                    await AuthorDao.RetrieveAllAuthors();
                    await FormattingDao.RetrieveAllFormattings();
                    await GroupDao.RetrieveAllGroups();
                    await PackDao.RetrieveAllPacks();
                    await RuleDao.RetrieveKeywordsAndSchemeIcons();
                    await SetDao.RetrieveAllSets();
                    SendContentAsEmbed(context, 'All lists updated!', null, true);
                    break;
                case 'authors':
                    await AuthorDao.RetrieveAllAuthors();
                    SendContentAsEmbed(context, 'Authors list updated!', null, true);
                    break;
                case 'configuration':
                    await ConfigurationDao.RetrieveConfiguration();
                    SendContentAsEmbed(context, 'Primary configuration updated!', null, true);
                    break;
                case 'formattings':
                    await FormattingDao.RetrieveAllFormattings();
                    SendContentAsEmbed(context, 'Formattings list updated!', null, true);
                    break;
                case 'groups':
                    await GroupDao.RetrieveAllGroups();
                    SendContentAsEmbed(context, 'Groups list updated!', null, true);
                    break;
                case 'packs':
                    await PackDao.RetrieveAllPacks();
                    SendContentAsEmbed(context, 'Packs list updated!', null, true);
                    break;
                case 'rules':
                    await RuleDao.RetrieveKeywordsAndSchemeIcons();
                    SendContentAsEmbed(context, 'Rules list updated!', null, true);
                    break;
                case 'sets':
                    await SetDao.RetrieveAllSets();
                    SendContentAsEmbed(context, 'Sets list updated!', null, true);
                    break;
                default:
                    SendContentAsEmbed(context, 'That option is invalid...', null, true);
            }
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(context, 'Something went wrong... Check the logs to find out more.');
        }
    }
}