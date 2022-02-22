const { SlashCommandBuilder } = require('@discordjs/builders');
const { ConfigurationDao } = require('../dao/configurationDao');
const { cardOfTheDayLoop, cardOfTheDay } = require('../utilities/cardOfTheDayHelper');
const { ReportError } = require('../utilities/errorHelper');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cotd')
        .setDescription('Manually emit a Card of the Day.')
        .addStringOption(option =>
            option
                .setName('guild')
                .setDescription('Specify the ID of a particular guild in which to emit a Card of the Day.')
                .setRequired(false)),
    async execute(context) {
        if (!Authorized(context, true)) return;

        try {
            let guildId = context.options.getString('guild');
        
            if (!guildId) {
                cardOfTheDayLoop(context.client);

                SendContentAsEmbed(context, 'Card of the Day emitted!', null, true);
            }
            else {
                let guild = context.client.guilds.resolve(guildId);
                let data = ConfigurationDao.CONFIGURATION.CardOfTheDay[guildId];

                if (guild && data.channels) {
                    cardOfTheDay(guild, data.channels, data.role);

                    SendContentAsEmbed(context, 'Card of the Day emitted!', null, true);
                }
                else {
                    SendContentAsEmbed(context, 'An invalid guild ID was provided...', null, true);
                }
            }
        }
        catch (e) {
            ReportError(context, e);
        }
    }
}