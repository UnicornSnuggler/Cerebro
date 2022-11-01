const { SlashCommandBuilder } = require('discord.js');
const { ConfigurationDao } = require('../dao/configurationDao');
const { deckOfTheDayLoop, deckOfTheDay } = require('../utilities/deckOfTheDayHelper');
const { ReportError } = require('../utilities/errorHelper');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dotd')
        .setDescription('Manually emit a Deck of the Day.')
        .addStringOption(option =>
            option
                .setName('guild')
                .setDescription('Specify the ID of a particular guild in which to emit a Deck of the Day.')
                .setRequired(false)),
    async execute(context) {
        if (!Authorized(context, true)) return;

        try {
            let guildId = context.options.getString('guild');
        
            if (!guildId) {
                deckOfTheDayLoop(context.client);

                SendContentAsEmbed(context, 'Deck of the Day emitted!', null, true);
            }
            else {
                let guild = context.client.guilds.resolve(guildId);
                let data = ConfigurationDao.CONFIGURATION.DeckOfTheDay[guildId];

                if (guild && data && data.channels) {
                    deckOfTheDay(guild, data.channels, data.role);

                    SendContentAsEmbed(context, 'Deck of the Day emitted!', null, true);
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