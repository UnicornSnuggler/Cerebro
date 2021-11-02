const { MessageEmbed } = require('discord.js');
const { BuildImagePath, FormatSymbols, FormatText } = require('./stringHelper');
const { COLORS } = require('../constants');

exports.BuildEmbed = function(rule)
{
    var embed = new MessageEmbed();

    var imagePath = BuildImagePath(process.env.ruleImagePrefix, rule.Id);

    embed.setColor(COLORS["Basic"]);
    embed.setTitle(FormatSymbols(rule.Title));
    embed.setURL(imagePath);

    if (rule.Reference != null)
    {
        embed.setDescription(FormatText(rule.Reference));
        embed.setThumbnail(imagePath);
    }
    else
    {
        embed.setImage(imagePath);
    }

    if (rule.Footer != null)
    {
        embed.setFooter(rule.Footer);
    }

    return embed;
};

exports.Summary = function(rule)
{
    return FormatSymbols(rule.Title);
};