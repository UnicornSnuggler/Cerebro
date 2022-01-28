const { MessageEmbed } = require('discord.js');
const { FormatSymbols, FormatText } = require('./stringHelper');
const { COLORS } = require('../constants');

const BuildRuleImagePath = exports.BuildRuleImagePath = function(rule) {
    return `${process.env.ruleImagePrefix}${rule.Official ? 'official/' : `unofficial/`}${rule.Id}.jpg`;
}

exports.BuildEmbed = function(rule) {
    let embed = new MessageEmbed();

    let imagePath = BuildRuleImagePath(rule);

    embed.setColor(COLORS["Basic"]);
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