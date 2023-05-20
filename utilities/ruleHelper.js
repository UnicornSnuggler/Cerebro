const { EmbedBuilder } = require('discord.js');
const { FormatSymbols, FormatText } = require('./stringHelper');
const { COLORS } = require('../constants');

const BuildRuleImagePath = exports.BuildRuleImagePath = function(rule) {
    return `${process.env.ruleImagePrefix}${rule.Official ? 'official/' : `unofficial/`}${rule.Id}.jpg`;
}

exports.BuildTemporaryApologyEmbed = function() {
    let embed = new EmbedBuilder();

    embed.setColor(COLORS.Default);
    embed.setTitle('Warning...');

    embed.setDescription(`**A note from <@132708937584607233>**: The bulk of Cerebro's rules entries have not been updated since the release of Version 1.5 of the Marvel Champions Rules Reference Guide. The following data is almost certainly stale. Please be patient as I slowly work on updating the database to utilize the new data. Thank you! <:otter_love:801992707433562162>`);

    return embed;
}

exports.BuildEmbed = function(rule) {
    let embed = new EmbedBuilder();

    let imagePath = BuildRuleImagePath(rule);

    embed.setColor(COLORS.Basic);
    embed.setTitle(FormatSymbols(rule.Title));
    embed.setURL(imagePath);

    if (rule.Reference)
    {
        embed.setDescription(FormatText(rule.Reference));
        embed.setThumbnail(imagePath);
    }
    else embed.setImage(imagePath);

    if (rule.Footer) embed.setFooter({ text: rule.Footer });

    return embed;
}

exports.Summary = function(rule) {
    return FormatSymbols(rule.Title);
}