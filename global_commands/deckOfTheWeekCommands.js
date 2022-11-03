const { SlashCommandBuilder } = require('discord.js');
const { ConfigurationDao } = require('../dao/configurationDao');
const { deckOfTheWeekLoop, deckOfTheWeek } = require('../utilities/deckOfTheWeekHelper');
const { ReportError } = require('../utilities/errorHelper');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dotw')
        .setDescription('Manually emit a Deck of the Week.')
        .addStringOption(option =>
            option
                .setName('guild')
                .setDescription('Specify the ID of a particular guild in which to emit a Deck of the Week.')
                .setRequired(false)),
    async execute(context) {
        if (!Authorized(context, true)) return;

        try {
            let guildId = context.options.getString('guild');
        
            if (!guildId) {
                deckOfTheWeekLoop(context.client);

                SendContentAsEmbed(context, 'Deck of the Week emitted!', null, true);
            }
            else {
                let guild = context.client.guilds.resolve(guildId);
                let data = ConfigurationDao.CONFIGURATION.DeckOfTheWeek[guildId];

                if (guild && data && data.channels) {
                    deckOfTheWeek(guild, data.channels, data.role);

                    SendContentAsEmbed(context, 'Deck of the Week emitted!', null, true);
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