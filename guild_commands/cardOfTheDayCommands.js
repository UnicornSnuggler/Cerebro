const { SlashCommandBuilder } = require('@discordjs/builders');
const { cardOfTheDay } = require('../utilities/cardOfTheDayHelper');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cotd')
        .setDescription('Manually emit a Card of the Day.'),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            cardOfTheDay(context.client);
            SendContentAsEmbed(context, 'Card of the Day emitted!', null, true);
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(context, 'Something went wrong... Check the logs to find out more.');
        }
    }
}