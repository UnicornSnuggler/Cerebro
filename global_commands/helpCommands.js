const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Authorized } = require('../utilities/messageHelper');
const { COLORS } = require('../constants');
const { ReportError } = require('../utilities/errorHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get some help getting started!'),
    async execute(context) {
        if (!Authorized(context)) return;

        try {
            const embed = new EmbedBuilder()
                .setTitle('Help')
                .setColor(COLORS.Default);

            embed.addFields(
                { name: 'Overview', value: 'Cerebro is a bot designed to facilitate the process of looking up and discussing cards and rules pertaining to the Marvel Champions living card game.' },
                { name: 'Rules Reference', value: 'Marvel Champions\' Rules Reference is a comprehensive guide that provides in-depth rules and guidelines for all facets of the game. ' +
                    'Cerebro is also equipped to handle queries made for entries in the Rules Reference. ' +
                    'This can be done by wrapping the name of the entry being queried in two sets of parentheses — `((like this))`.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Rule-Commands).' },
                { name: 'Official Cards', value: 'Any cards printed by Fantasy Flight Games in official Marvel Champions products are considered \'official cards\'. ' +
                    'Queries for official cards are made by wrapping the name of the card being queried in two sets of curly braces — `{{like this}}`.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#wrapper-syntax).' },
                { name: 'Unofficial Cards', value: 'Any cards created by members of the Marvel Champions community with no affiliation to Fantasy Flight Games are considered \'unofficial cards\'. ' +
                    'Queries for unofficial cards are made by wrapping the name of the card being queried in two sets of angle brackets — `<<like this>>`.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#wrapper-syntax).' },
                { name: 'Advanced Card Queries', value: 'The `/card` command can be used to perform in-depth queries for cards based on a series of filters. ' +
                    'Cards can be filtered by their respective `author`, `classification` *(aspect)*, `cost`, `name`, `resource`, `text`, `traits`, and `type` values.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#querying).' },
                { name: 'Browse Collections', value: 'Sets and packs can be browsed using the `/browse` command. ' +
                    'Card results will be returned with two buttons — `Previous Card` and `Next Card` — that can be used to navigate between all of the cards in the queried collection.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Browse-Commands).' },
                { name: 'Wildcards', value: 'Users can force Cerebro to make partial matches by incorporating a wildcard symbol — or asterisk (`*`) — anywhere in their term. ' +
                    'In this way, the query `{{Captain America*}}` will match `Captain America`, `Captain America\'s Shield`, and `Captain America\'s Helmet`.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Card-Commands#wildcards).' },
                { name: 'Submitting Requests', value: 'Users can request that new data and features be added to Cerebro and review their existing requests using the `/request` command. ' +
                    'Submitted requests will be reviewed by moderators and either approved, denied, or banished. ' +
                    'Follow-up requests cannot be made until a moderator has approved the request or 24 hours have elapsed since the request was submitted.\n' +
                    '[Read more](https://github.com/UnicornSnuggler/Cerebro/wiki/Request-Commands).' }
            );

            context.reply({
                allowedMentions: {
                    repliedUser: false
                },
                embeds: [embed],
                failIfNotExists: false
            });
        }
        catch (e) {
            ReportError(context, e);
        }
    }
}