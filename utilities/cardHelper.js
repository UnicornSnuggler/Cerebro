const { Formatters, MessageEmbed, Util } = require('discord.js');
const { BuildImagePath, FormatSymbols, FormatText, SpoilerIfIncomplete, QuoteText, ItalicizeText } = require('./stringHelper');
const { RuleDao } = require('../dao/ruleDao');
const { Summary } = require('./printingHelper');
const { COLORS, ID_LENGTH, SYMBOLS } = require('../constants');

exports.BuildEmbed = function(card, alternateArt = null)
{
    var embed = new MessageEmbed();

    var description = [];
    var subheaderArray = [BuildHeader(card)];

    if (card.Traits != null)
    {
        subheaderArray.push(Formatters.italic(Formatters.bold(card.Traits)));
    }

    var subheader = subheaderArray.join('\n');

    description.push(SpoilerIfIncomplete(subheader, card.Incomplete));

    var stats = BuildStats(card);

    if (stats.length > 0)
    {
        var stats = FormatSymbols(stats);

        description.push(SpoilerIfIncomplete(stats, card.Incomplete));
    }

    var body = [];

    if (card.Rules != null)
    {
        var formattedRules = FormatText(card.Rules, card.Name);

        body.push(QuoteText(SpoilerIfIncomplete(formattedRules, card.Incomplete)));
    }

    if (card.Special != null)
    {
        var formattedSpecial = FormatText(card.Special, card.Name);

        body.push(QuoteText(SpoilerIfIncomplete(formattedSpecial, card.Incomplete)));
    }

    if (card.Flavor != null)
    {
        var escapedFlavor = Util.escapeMarkdown(card.Flavor);

        body.push(SpoilerIfIncomplete(ItalicizeText(escapedFlavor), card.Incomplete));
    }

    if (body.length > 0)
    {
        description.push(body.join('\n\n'));
    }

    embed.setColor(COLORS[(card.Type == 'Villain' || card.Type == 'Main Scheme' ? 'Villain' : card.Classification)]);
    embed.setTitle(SpoilerIfIncomplete((card.Unique ? SYMBOLS['{u}'] : '') + card.Name + (card.Subname != null ? ` — ${card.Subname}` : '' ), card.Incomplete));
    embed.setURL(BuildImagePath(process.env.cardImagePrefix, alternateArt ?? card.Id));
    embed.setDescription(description.join('\n\n'));
    embed.setFooter(BuildFooter(card));
    
    if (!card.Incomplete)
    {
        embed.setThumbnail(BuildImagePath(process.env.cardImagePrefix, alternateArt ?? card.Id));
    }

    return embed;
};

var BuildFooter = exports.BuildFooter = function(card)
{
    var firstPrinting = card.Printings.find(x => x.ArtificialId == card.Id);
    var reprints = card.Printings.filter(x => x.ArtificialId != card.Id);

    var footer = [];
    footer.push(Summary(firstPrinting));

    if (reprints.length > 0 && reprints.length <= 3)
    {
        reprints.forEach(printing => {
            footer.push(Summary(printing));
        });
    }
    else if (reprints.length > 3)
    {
        for (var i = 0; i < 2; i++)
        {
            footer.push(Summary(reprints[i]));
        }

        footer.push(`...and ${reprints.length - 2} more reprints.`);
    }

    return footer.join('\n');
};

var BuildHeader = exports.BuildHeader = function(card)
{
    var header = '';

    if (card.Classification != 'Encounter' && card.Type != 'Hero' && card.Type != 'Alter-Ego')
    {
        header += `${Formatters.bold(card.Classification)} `;
    }

    header += Formatters.bold(card.Type);

    if (card.Stage != null)
    {
        header += ` — ${Formatters.italic(`Stage ${card.Stage}`)}`;
    }

    return header;
};

exports.BuildRulesEmbed = function(card, alternateArt = null)
{
    var embed = new MessageEmbed();

    var ruleEntries = EvaluateRules(card);

    ruleEntries.forEach(ruleEntry => {
        embed.addField(FormatSymbols(ruleEntry.title), FormatSymbols(ruleEntry.description));
    });

    embed.setColor(COLORS[(card.Type == 'Villain' || card.Type == 'Main Scheme' ? 'Villain' : card.Classification)]);
    embed.setTitle(SpoilerIfIncomplete((card.Unique ? SYMBOLS['{u}'] : '') + card.Name + (card.Subname != null ? ` — ${card.Subname}` : '' ), card.Incomplete));
    embed.setURL(BuildImagePath(process.env.cardImagePrefix, alternateArt ?? card.Id));
    embed.setFooter(BuildFooter(card));
    
    if (!card.Incomplete)
    {
        embed.setThumbnail(BuildImagePath(process.env.cardImagePrefix, alternateArt ?? card.Id));
    }

    return embed;
}

var BuildStats = exports.BuildStats = function(card)
{
    var components = [];

    var hasEconomy = card.Cost != null || card.Resource != null || card.Boost != null;
    var hasAbilities = card.Recover != null || card.Scheme != null || card.Thwart != null || card.Attack != null || card.Defense != null;
    var hasFeatures = card.Hand != null || card.Health != null || card.Acceleration != null || card.Threat != null;

    if (hasEconomy)
    {
        var economy = [];

        if (card.Cost != null)
        {
            economy.push(`Cost: ${card.Cost}`);
        }

        if (card.Resource != null)
        {
            economy.push(`Resource: ${card.Resource}`);
        }

        if (card.Boost != null)
        {
            economy.push(`Boost: ${card.Boost}`);
        }

        components.push(economy.join('\n'));
    }

    if (hasAbilities)
    {
        var abilities = [];

        if (card.Recover != null)
        {
            abilities.push(`REC: ${card.Recover}`);
        }

        if (card.Scheme != null)
        {
            var suffix = card.Slash ? '/THW' : '';
            abilities.push(`SCH${suffix}: ${card.Scheme}`);
        }

        if (card.Thwart != null)
        {
            var prefix = card.Slash ? 'SCH/' : '';
            abilities.push(`${prefix}THW: ${card.Thwart}`);
        }

        if (card.Attack != null)
        {
            abilities.push(`ATK: ${card.Attack}`);
        }

        if (card.Defense != null)
        {
            abilities.push(`DEF: ${card.Defense}`);
        }

        components.push(abilities.join('\n'));
    }

    if (hasFeatures)
    {
        var features = [];

        if (card.Hand != null)
        {
            features.push(`Hand Size: ${card.Hand}`);
        }

        if (card.Health != null)
        {
            features.push(`Health: ${card.Health}`);
        }

        if (card.Threat != null)
        {
            features.push(`Starting Threat: ${card.Threat}`);
        }

        if (card.Acceleration != null)
        {
            features.push(`Acceleration: ${card.Acceleration}`);
        }

        if (card.Threshold != null)
        {
            features.push(`Target Threat: ${card.Threshold}`);
        }

        components.push(features.join('\n'));
    }

    return components.join('\n\n');
};

const EvaluateRules = exports.EvaluateRules = function(card) {
    if (card.Rules || card.Special)
    {
        var rules = [];

        RuleDao.KEYWORDS_AND_ICONS.forEach(rule => {
            var matches = [];

            var pattern = new RegExp(rule.Regex, 'i');

            for (var text of [card.Rules, card.Special]) {
                var match = pattern.exec(text);

                if (match) matches.push(match);
            }

            matches.forEach(match => {
                var ruleEntry = {
                    title: rule.Title,
                    description: rule.Description
                };

                ["quantity", "start", "type"].forEach(replacement => {
                    ruleEntry.description = ruleEntry.description.replace(`{${replacement}}`, match.groups ? match.groups[replacement] : '');
                });

                if (!rules.find(x => x.title === ruleEntry.title && x.description === ruleEntry.description)) rules.push(ruleEntry);
            });
        });

        return rules.length > 0 ? [...new Set(rules)] : null;
    }
    else
    {
        return null;
    }
};

exports.FindUniqueArts = function(card)
{
    return card.Printings.filter(x => x.UniqueArt).map(x => x.ArtificialId);
}

const GetBaseId = exports.GetBaseId = function(card)
{
    return card.Id.substring(0, ID_LENGTH);
}

exports.ShareFaces = function(thisCard, thatCard)
{
    return thisCard.Id !== thatCard.Id && GetBaseId(thisCard) === GetBaseId(thatCard);
}

exports.ShareGroups = function(thisCard, thatCard)
{
    return thisCard.GroupId !== null && thatCard.GroupId !== null && thisCard.GroupId == thatCard.GroupId;
}