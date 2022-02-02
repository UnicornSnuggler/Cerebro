const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { SendContentAsEmbed, Authorized } = require('../utilities/messageHelper');
const { COLORS } = require('../constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get some help getting started!'),
    async execute(context) {
        if (!Authorized(context)) return;

        try {
            const embed = new MessageEmbed()
                .setTitle('Help')
                .setColor(COLORS.Default);

            embed.addField('Overview', 'Cerebro is a bot designed to facilitate the process of looking up and discussing cards and rules pertaining to the Marvel Champions living card game.');

            embed.addField('Rules Reference', 'Marvel Champions\' Rules Reference is a comprehensive guide that provides in-depth rules and guidelines for all facets of the game. ' +
                'Cerebro is also equipped to handle queries made for entries in the Rules Reference. ' +
                'This can be done by wrapping the name of the entry being queried in two sets of parentheses — `((like this))`.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Rule-Commands).');

            embed.addField('Official Cards', 'Any cards printed by Fantasy Flight Games in official Marvel Champions products are considered \'official cards\'. ' +
                'Queries for official cards are made by wrapping the name of the card being queried in two sets of curly braces — `{{like this}}`.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#wrapper-syntax).');

            embed.addField('Unofficial Cards', 'Any cards created by members of the Marvel Champions community with no affiliation to Fantasy Flight Games are considered \'unofficial cards\'. ' +
                'Queries for unofficial cards are made by wrapping the name of the card being queried in two sets of angle brackets — `<<like this>>`.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#wrapper-syntax).');

            embed.addField('Advanced Card Queries', 'The `/card` command can be used to perform in-depth queries for cards based on a series of filters. ' +
                'Cards can be filtered by their respective `aspect`, `author`, `cost`, `name`, `resource`, `text`, `traits`, and `type` values.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#querying).');

            embed.addField('Browse Collections', 'Sets and packs can be browsed using the `/browse` command. ' +
                'Card results will be returned with two buttons — `Previous Card` and `Next Card` — that can be used to navigate between all of the cards in the queried collection.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Browse-Commands).');

            embed.addField('Wildcards', 'Users can force Cerebro to make partial matches by incorporating a wildcard symbol — or asterisk (`*`) — anywhere in their term. ' +
                'In this way, the query `{{Captain America*}}` will match `Captain America`, `Captain America\'s Shield`, and `Captain America\'s Helmet`.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#wildcards).');

            embed.addField('Submitting Requests', 'Users can request that new data and features be added to Cerebro and review their existing requests using the `/request` command. ' +
                'Submitted requests will be reviewed by moderators and either approved, denied, or banished. ' +
                'Follow-up requests cannot be made until a moderator has approved the request or 24 hours have elapsed since the request was submitted.\n' +
                '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Request-Commands).');

            context.reply({
                allowedMentions: {
                    repliedUser: false
                },
                embeds: [embed]
            });
        }
        catch (e) {
            console.log(e);
            SendContentAsEmbed(context, 'Something went wrong... Check the logs to find out more.');
        }
    }
}