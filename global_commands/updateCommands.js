const { SlashCommandBuilder } = require('discord.js');
const { ArtistDao } = require('../dao/artistDao');
const { AuthorDao } = require('../dao/authorDao');
const { ConfigurationDao } = require('../dao/configurationDao');
const { FormattingDao } = require('../dao/formattingDao');
const { GroupDao } = require('../dao/groupDao');
const { PackDao } = require('../dao/packDao');
const { RuleDao } = require('../dao/ruleDao');
const { SetDao } = require('../dao/setDao');
const { ReportError } = require('../utilities/errorHelper');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update locally stored lists.')
        .addStringOption(option =>
            option.setName('list')
                .setDescription('The list to be updated.')
                .setRequired(true)
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Artists', value: 'artists' },
                    { name: 'Authors', value: 'authors' },
                    { name: 'Configuration', value: 'configuration' },
                    { name: 'Formattings', value: 'formattings' },
                    { name: 'Groups', value: 'groups' },
                    { name: 'Packs', value: 'packs' },
                    { name: 'Rules', value: 'rules' },
                    { name: 'Sets', value: 'sets' }
                )),
    async execute(context) {
        if (!Authorized(context, true)) return;
        
        try {
            switch (context.options.getString('list')) {
                case 'all':
                    await ArtistDao.UpdateArtistList();
                    await AuthorDao.RetrieveAllAuthors();
                    await FormattingDao.RetrieveAllFormattings();
                    await GroupDao.RetrieveAllGroups();
                    await PackDao.RetrieveAllPacks();
                    await RuleDao.RetrieveKeywordsAndSchemeIcons();
                    await SetDao.RetrieveAllSets();
                    SendContentAsEmbed(context, 'All lists updated!', null, true);
                    break;
                case 'artists':
                    await ArtistDao.UpdateArtistList();
                    SendContentAsEmbed(context, 'Artists list updated!', null, true);
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
            ReportError(context, e);
        }
    }
}