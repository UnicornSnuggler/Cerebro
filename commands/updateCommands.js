const { SlashCommandBuilder } = require('@discordjs/builders');
const { AuthorDao } = require('../dao/authorDao');
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
        .setDefaultPermission(false)
        .addStringOption(option =>
            option.setName('list')
                .setDescription('The list to be updated.')
                .setRequired(true)
                .addChoice('All', 'all')
                .addChoice('Authors', 'authors')
                .addChoice('Formattings', 'formattings')
                .addChoice('Groups', 'groups')
                .addChoice('Packs', 'packs')
                .addChoice('Rules', 'rules')
                .addChoice('Sets', 'sets')),
    async execute(interaction) {
        if (!Authorized(context)) return;
        
        try {
            switch (interaction.options.getString('list')) {
                case 'all':
                    await AuthorDao.RetrieveAllAuthors();
                    await FormattingDao.RetrieveAllFormattings();
                    await GroupDao.RetrieveAllGroups();
                    await PackDao.RetrieveAllPacks();
                    await RuleDao.RetrieveKeywordsAndSchemeIcons();
                    await SetDao.RetrieveAllSets();
                    SendContentAsEmbed(interaction, 'All lists updated!', null, true);
                    break;
                case 'authors':
                    await AuthorDao.RetrieveAllAuthors();
                    SendContentAsEmbed(interaction, 'Authors list updated!', null, true);
                    break;
                case 'formattings':
                    await FormattingDao.RetrieveAllFormattings();
                    SendContentAsEmbed(interaction, 'Formattings list updated!', null, true);
                    break;
                case 'groups':
                    await GroupDao.RetrieveAllGroups();
                    SendContentAsEmbed(interaction, 'Groups list updated!', null, true);
                    break;
                case 'packs':
                    await PackDao.RetrieveAllPacks();
                    SendContentAsEmbed(interaction, 'Packs list updated!', null, true);
                    break;
                case 'rules':
                    await RuleDao.RetrieveKeywordsAndSchemeIcons();
                    SendContentAsEmbed(interaction, 'Rules list updated!', null, true);
                    break;
                case 'sets':
                    await SetDao.RetrieveAllSets();
                    SendContentAsEmbed(interaction, 'Sets list updated!', null, true);
                    break;
                default:
                    SendContentAsEmbed(interaction, 'That option is invalid...', null, true);
            }
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(interaction, 'Something went wrong... Check the logs to find out more.');
        }
    }
}