const { italic, bold, escapeMarkdown, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder, EmbedBuilder, ComponentType } = require('discord.js');
const { PackDao } = require('../dao/packDao');
const { RuleDao } = require('../dao/ruleDao');
const { ConfigurationDao } = require('../dao/configurationDao');
const { CreateEmbed, RemoveComponents, SendMessageWithOptions } = require('../utilities/messageHelper');
const { Summary } = require('./printingHelper');
const { FormatSymbols, FormatText, SpoilerIfSpoilerTagged, QuoteText, ItalicizeText } = require('./stringHelper');
const { RELEASED_EMOJI, COLORS, ID_LENGTH, INTERACT_APOLOGY, LOAD_APOLOGY, SYMBOLS, INTERACT_TIMEOUT, TINKERER_EMOJI, WARNING_EMOJI, REVIEWING_EMOJI, SECOND_MILLIS, MAX_ATTACHMENTS, ARTIST_EMOJI } = require('../constants');
const { NavigationCollection } = require('../models/navigationCollection');
const { SetDao } = require('../dao/setDao');
const { ReportError } = require('./errorHelper');
const { CreateStringFromArray } = require('./arrayHelper');
const { ArtistDao } = require('../dao/artistDao');
const { GetUserIdFromContext } = require('./userHelper');

const BuildCardImagePath = exports.BuildCardImagePath = function(card, artStyle = card.Id) {
    return `${process.env.cardImagePrefix}${card.Official ? 'official/' : `unofficial/`}${artStyle}.jpg`;
}

exports.BuildCollectionFromBatch = function(batch) {
    let collection = new NavigationCollection();
    collection.tag = 'Card';
    
    for (let card of batch) {
        collection.cards.push(card);

        let element = {
            cardId: card.Id,
            faces: null
        };

        let baseId = GetBaseId(card);

        if (card.Id.length != baseId.length) element.faces = batch.filter(x => x.Id.includes(baseId)).map(x => x.Id);

        collection.elements.push(element);
    }
    
    collection.faces = collection.elements[0].faces ?? [];

    return collection;
}

const BuildEmbed = exports.BuildEmbed = function(card, alternateArt = null, spoilerFree = false) {
    let embed = new EmbedBuilder();

    let description = [];
    let subheader = [BuildHeader(card)];

    if (card.Traits) subheader.push(ItalicizeText(bold(card.Traits.join(', '))));

    description.push(SpoilerIfSpoilerTagged(subheader.join('\n'), card.SpoilerTag && !spoilerFree));

    let stats = BuildStats(card);

    if (stats.length > 0) {
        stats = FormatSymbols(stats);

        description.push(SpoilerIfSpoilerTagged(stats, card.SpoilerTag && !spoilerFree));
    }

    let body = [];

    if (card.Rules) {
        let formattedRules = FormatText(card.Rules, card.Name);

        body.push(QuoteText(SpoilerIfSpoilerTagged(formattedRules, card.SpoilerTag && !spoilerFree)));
    }

    if (card.Special) {
        let formattedSpecial = FormatText(card.Special, card.Name);

        body.push(QuoteText(SpoilerIfSpoilerTagged(formattedSpecial, card.SpoilerTag && !spoilerFree)));
    }

    let currentPrinting = GetPrintingByArtificialId(card, alternateArt ?? card.Id);

    if (currentPrinting.Flavor) {
        let escapedFlavor = escapeMarkdown(currentPrinting.Flavor);

        body.push(SpoilerIfSpoilerTagged(ItalicizeText(escapedFlavor), card.SpoilerTag && !spoilerFree));
    }

    if (card.ArtificialPackId) {
        let emojiPack = PackDao.PACKS.find(x => x.Id === card.ArtificialPackId);

        body.push(`${emojiPack.Emoji} **${emojiPack.Name}**`);
    }
    else {
        let emojiPack = PackDao.PACKS.find(x => x.Id === currentPrinting.PackId);

        if (emojiPack.Emoji) {
            body.push(`${emojiPack.Emoji} **${emojiPack.Name}**`);
        }
    }

    let credits = BuildCredits(card);

    if (credits) body.push(credits);

    if (body.length > 0) description.push(body.join('\n\n'));

    let image = BuildCardImagePath(card, alternateArt ?? card.Id);

    embed.setColor(COLORS[(["Leader", "Main Scheme", "Villain"].includes(card.Type) ? 'Villain' : card.Classification.replace('\'', ''))]);
    embed.setTitle(SpoilerIfSpoilerTagged(FormatSymbols((card.Unique ? '{u}' : '') + card.Name + (card.Subname ? ` — ${card.Subname}` : '' ), card.SpoilerTag && !spoilerFree)));
    embed.setURL(image);
    embed.setDescription(description.join('\n\n'));
    embed.setFooter({ text: BuildFooter(card, spoilerFree) });

    let printing = GetPrintingByArtificialId(card, alternateArt ?? card.Id);
    let pack = PackDao.PACKS.find(x => x.Id === printing.PackId);
    
    if (spoilerFree || !card.SpoilerTag) embed.setThumbnail(image);

    return embed;
}

const BuildCredits = exports.BuildCredits = function(card) {
    let credits = [];

    if (card.Artists) {
        let list = CreateStringFromArray(card.Artists.map(x => bold(ArtistDao.ARTISTS.find(y => y.Id === x).Name)), ', ', false);

        credits.push(`${ARTIST_EMOJI} ${list}`);
    }

    if (!card.Official) {
        let pack = PackDao.PACKS.find(x => x.Id === GetPrintingByArtificialId(card, card.Id).PackId);
        
        
        credits.push(`${bold('Author')}: <@${card.AuthorId}>`);
        switch (pack.ReleaseStatus) {
            case 3:
                credits.push(`${REVIEWING_EMOJI} Pending council review...`);
                break;
            case 2:
                credits.push(`${RELEASED_EMOJI} Released in Council Set #${pack.CouncilNumber}!`);
                break;
            case 1:
                credits.push(`${TINKERER_EMOJI} The Tinkerer Blue Gold Seal of Approval!`);
                break;
            default:
                credits.push(`${WARNING_EMOJI} Not yet released...`);
        }
    }

    return credits.join('\n');
}

const BuildFooter = exports.BuildFooter = function(card, spoilerFree = false) {
    let reprints = card.Printings.filter(x => x.ArtificialId != card.Id);

    let footer = [];

    footer.push(Summary(GetPrintingByArtificialId(card, card.Id), spoilerFree));

    if (reprints.length > 0 && reprints.length <= 3) {
        for (let printing of reprints) footer.push(Summary(printing, spoilerFree));
    }
    else if (reprints.length > 3) {
        for (let i = 0; i < 2; i++) footer.push(Summary(reprints[i], spoilerFree));

        footer.push(`...and ${reprints.length - 2} more reprints.`);
    }

    return footer.join('\n');
}

const BuildHeader = exports.BuildHeader = function(card) {
    let description = card.Type;
    let setId = GetPrintingByArtificialId(card, card.Id).SetId ?? null;
    
    if (setId) {
        let set = SetDao.SETS.find(x => x.Id === setId);

        if (card.Classification === 'Hero' && !['Alter-Ego', 'Hero'].includes(card.Type)) description = `${set.Name} ${description}`;
    }
    else description = `${card.Classification} ${description}`;

    let header = bold(description);

    if (card.Stage) header += ` — ${italic(`Stage ${card.Stage}`)}`;

    return header;
}

const BuildRulesEmbed = exports.BuildRulesEmbed = function(card, alternateArt = null, spoilerFree = false) {
    let embed = new EmbedBuilder();
    let image = BuildCardImagePath(card, alternateArt ?? card.Id);
    let ruleEntries = EvaluateRules(card);

    for (let ruleEntry of ruleEntries) {
        embed.addFields([
            { name: FormatSymbols(ruleEntry.title), value: FormatSymbols(ruleEntry.description) }
        ]);
    }

    embed.setColor(COLORS[(card.Type == 'Villain' || card.Type == 'Main Scheme' ? 'Villain' : card.Classification.replace('\'', ''))]);
    embed.setTitle(SpoilerIfSpoilerTagged((card.Unique ? SYMBOLS['{u}'] : '') + card.Name + (card.Subname != null ? ` — ${card.Subname}` : '' ), card.SpoilerTag && !spoilerFree));
    embed.setURL(image);
    embed.setFooter({ text: BuildFooter(card, spoilerFree) });

    let printing = GetPrintingByArtificialId(card, alternateArt ?? card.Id);
    let pack = PackDao.PACKS.find(x => x.Id === printing.PackId);
    
    if (spoilerFree || !card.SpoilerTag) embed.setThumbnail(image);

    return embed;
}

const BuildStats = exports.BuildStats = function(card) {
    let components = [];

    let hasEconomy = card.Cost != null || card.Resource != null || card.Boost != null;
    let hasAbilities = card.Recover != null || card.Scheme != null || card.Thwart != null || card.Attack != null || card.Defense != null;
    let hasFeatures = card.Hand != null || card.Health != null || card.Acceleration != null || card.StartingThreat != null;

    if (hasEconomy)
    {
        let economy = [];

        if (card.Cost) economy.push(`Cost: ${card.Cost}`);

        if (card.Resource) economy.push(`Resource: ${card.Resource}`);

        if (card.Boost) economy.push(`Boost: ${card.Boost}`);

        components.push(economy.join('\n'));
    }

    if (hasAbilities)
    {
        let abilities = [];

        if (card.Recover) abilities.push(`REC: ${card.Recover}`);

        if (card.Scheme)
        {
            let suffix = card.Slash ? '/THW' : '';
            abilities.push(`SCH${suffix}: ${card.Scheme}`);
        }

        if (card.Thwart)
        {
            let prefix = card.Slash ? 'SCH/' : '';
            abilities.push(`${prefix}THW: ${card.Thwart}`);
        }

        if (card.Attack) abilities.push(`ATK: ${card.Attack}`);

        if (card.Defense) abilities.push(`DEF: ${card.Defense}`);

        components.push(abilities.join('\n'));
    }

    if (hasFeatures)
    {
        let features = [];

        if (card.Hand) features.push(`Hand Size: ${card.Hand}`);

        if (card.Health) features.push(`Health: ${card.Health}`);

        if (card.StartingThreat) features.push(`Starting Threat: ${card.StartingThreat}`);

        if (card.Acceleration) features.push(`Acceleration: ${card.Acceleration}`);

        if (card.TargetThreat) features.push(`Target Threat: ${card.TargetThreat}`);

        components.push(features.join('\n'));
    }

    return components.join('\n\n');
}

exports.CreateSelectBox = function(cards) {
    let selector = new StringSelectMenuBuilder()
        .setCustomId('selector')
        .setPlaceholder('No card selected...');
    
    for (let card of cards) {
        let description = card.Type;
        let setId = GetPrintingByArtificialId(card, card.Id).SetId ?? null;
        
        if (setId) {
            let set = SetDao.SETS.find(x => x.Id === setId);

            if (card.Classification === 'Hero' && !['Alter-Ego', 'Hero'].includes(card.Type)) description = `${set.Name} ${description}`;
            else if (card.Classification === 'Encounter') description = `${description} (${set.Name})`;
        }
        else description = `${card.Classification} ${description}`;
        
        let emoji = undefined;

        if (card.Resource) emoji = SYMBOLS[card.Resource];

        let trimmedName = card.Name;
    
        if (card.Name.match('\({[a-z]}\)')) {
            emoji = SYMBOLS[card.Name.match('{[a-z]}')];
            trimmedName = card.Name.replace(/ \({[a-z]}\)/, '');
        }

        selector.addOptions([{
            label: `${trimmedName}${card.Subname ? ` (${card.Subname})` : ''}${card.Stage ? ` — Stage ${card.Stage}` : ''}`,
            description: description,
            emoji: emoji,
            value: card.Id
        }]);
    }

    return selector;
}

const EvaluateRules = exports.EvaluateRules = function(card) {
    if (!card.Rules && !card.Special) return null;

    let rules = [];

    for (let rule of RuleDao.KEYWORDS_AND_ICONS) {
        let matches = [];

        let pattern = new RegExp(rule.Regex, 'i');

        for (let text of [card.Rules, card.Special]) {
            let match = pattern.exec(text);

            if (match) matches.push(match);
        }

        for (let match of matches) {
            let ruleEntry = {
                title: rule.Title,
                description: rule.Description
            };

            for (let replacement of ["quantity", "start", "type"]) ruleEntry.description = ruleEntry.description.replaceAll(`{${replacement}}`, match.groups ? match.groups[replacement] : '');

            if (!rules.some(x => x.title === ruleEntry.title && x.description === ruleEntry.description)) rules.push(ruleEntry);
        }
    }

    return rules.length > 0 ? [...new Set(rules)] : null;
}

const FindUniqueArts = exports.FindUniqueArts = function(card) {
    return card.Printings.filter(x => x.UniqueArt).map(x => x.ArtificialId);
}

const GetBaseId = exports.GetBaseId = function(card) {
    let threshold = card.Official ? ID_LENGTH : ID_LENGTH + card.AuthorId.length + 1;

    return card.Id.substring(0, threshold);
}

const GetPrintingByArtificialId = exports.GetPrintingByArtificialId = function(card, artificialId) {
    return card.Printings.find(x => x.ArtificialId === artificialId);
}

exports.IsCampaignCard = function(card) {
    let result = false;
    let campaignSets = SetDao.CAMPAIGN_SET_IDS;

    card.Printings.forEach(printing => {
        if (campaignSets.includes(printing.SetId)) result = true;
    });

    return result;
}

exports.ResourceConverter = {
    'energy': '{e}',
    'mental': '{m}',
    'physical': '{p}',
    'wild': '{w}'
};

exports.ShareFaces = function(thisCard, thatCard) {
    return thisCard.Id != thatCard.Id && GetBaseId(thisCard) === GetBaseId(thatCard);
}

exports.ShareGroups = function(thisCard, thatCard) {
    return thisCard.GroupId && thatCard.GroupId && thisCard.GroupId == thatCard.GroupId;
}

const Imbibe = exports.Imbibe = function(context, card, currentArtStyle, currentFace, currentElement, collection, rulesToggle, artToggle, message = null, spoilerToggle = false) {
    try {
        let navigationRow = new ActionRowBuilder();
        let toggleRow = new ActionRowBuilder();

        let spoilerOverride = (!context.guildId || (ConfigurationDao.CONFIGURATION.SpoilerExceptions[context.guildId] && ConfigurationDao.CONFIGURATION.SpoilerExceptions[context.guildId].includes(context.channelId)));

        let artStyles = FindUniqueArts(card);

        if (collection.elements.length > 0) {
            let style = collection.tag === 'Card' ? ButtonStyle.Secondary : ButtonStyle.Primary;

            navigationRow.addComponents(new ButtonBuilder()
                .setCustomId('previousElement')
                .setLabel(`Previous ${collection.tag}`)
                .setStyle(style));
            
            navigationRow.addComponents(new ButtonBuilder()
                .setCustomId('nextElement')
                .setLabel(`Next  ${collection.tag}`)
                .setStyle(style));
        }

        if (collection.faces.length > 1)
            navigationRow.addComponents(new ButtonBuilder()
                .setCustomId('cycleFace')
                .setLabel('Flip Card')
                .setStyle(ButtonStyle.Primary));

        if (artStyles.length > 1)
            navigationRow.addComponents(new ButtonBuilder()
                .setCustomId('cycleArt')
                .setLabel('Change Art')
                .setStyle(ButtonStyle.Primary));

        if (EvaluateRules(card))
            toggleRow.addComponents(new ButtonBuilder()
                .setCustomId('toggleRules')
                .setLabel('Toggle Rules')
                .setStyle(ButtonStyle.Secondary));

        if (!spoilerOverride && card.SpoilerTag)
            toggleRow.addComponents(new ButtonBuilder()
                .setCustomId('toggleSpoiler')
                .setLabel('Unveil Secretly')
                .setStyle(ButtonStyle.Secondary));

        toggleRow.addComponents(new ButtonBuilder()
            .setCustomId('toggleArt')
            .setLabel('Toggle Art')
            .setStyle(ButtonStyle.Success));

        toggleRow.addComponents(new ButtonBuilder()
            .setCustomId('clearComponents')
            .setLabel('Clear Buttons')
            .setStyle(ButtonStyle.Danger));

        let promise;

        let artificialId = artStyles[currentArtStyle];

        let components = [];
        let embeds = [];
        let files = [];
        
        for (let row of [navigationRow, toggleRow]) {
            if (!spoilerToggle && row.components.length > 0) components.push(row);
        }

        if (!artToggle) {
            if (!rulesToggle) embeds.push(BuildEmbed(card, artificialId, spoilerOverride || spoilerToggle));
            else embeds.push(BuildRulesEmbed(card, artificialId, spoilerOverride || spoilerToggle));
        }
        else {
            files.push({
                attachment: BuildCardImagePath(card, artificialId),
                name: `${(!spoilerOverride && (!spoilerToggle && card.SpoilerTag)) ? 'SPOILER_' : ''}${artificialId}.jpg`,
                spoiler: (!spoilerOverride && (!spoilerToggle && card.SpoilerTag))
            });
        }

        let messageOptions = {
            components: components,
            embeds: embeds,
            files: files
        };

        if (message) promise = message.edit(messageOptions);
        else promise = SendMessageWithOptions(context, messageOptions, !spoilerOverride && spoilerToggle);
            
        promise.then((message) => {
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: INTERACT_TIMEOUT * SECOND_MILLIS });

            collector.on('collect', i => {
                let userId = GetUserIdFromContext(context);

                if (i.customId === 'toggleSpoiler') {
                    Imbibe(i, card, currentArtStyle, currentFace, currentElement, collection, rulesToggle, artToggle, null, true);
                }
                else if (i.user.id === userId) {
                    if (i.customId != 'clearComponents') collector.stop('navigation');

                    i.deferUpdate()
                    .then(async () => {
                        let nextArtStyle = currentArtStyle;
                        let nextCard = card;
                        let nextFace = currentFace;
                        let nextElement = currentElement;
                        let nextCollection = collection;
                        let nextRulesToggle = rulesToggle;
                        let nextArtToggle = artToggle;
                        let nextMessage = spoilerToggle ? null : message;
                        let nextSpoilerToggle = spoilerToggle;

                        switch (i.customId) {
                            case 'cycleArt':
                                nextArtStyle = currentArtStyle + 1 >= artStyles.length ? 0 : currentArtStyle + 1;

                                break;
                            case 'cycleFace':
                                nextArtStyle = 0;
                                nextFace = currentFace + 1 >= nextCollection.faces.length ? 0 : currentFace + 1;
                                nextCard = nextCollection.cards.find(x => x.Id === nextCollection.faces[nextFace]);
                                nextRulesToggle = false;
                                
                                if (nextCollection.elements) nextElement = nextCollection.elements.findIndex(x => x.cardId === nextCard.Id);

                                break;
                            case 'previousElement':
                                nextArtStyle = 0;
                                nextElement = currentElement - 1 >= 0 ? currentElement - 1 : nextCollection.elements.length - 1;
                                nextCard = nextCollection.cards.find(x => x.Id === nextCollection.elements[nextElement].cardId);
                                nextRulesToggle = false;
                                
                                if (nextCollection.elements[nextElement].faces) {
                                    nextCollection.faces = nextCollection.elements[nextElement].faces;
                                    nextFace = nextCollection.faces.findIndex(x => x === nextCard.Id);
                                }
                                else {
                                    nextCollection.faces = [];
                                    nextFace = -1;
                                }
                                
                                break;
                            case 'nextElement':
                                nextArtStyle = 0;
                                nextElement = currentElement + 1 >= nextCollection.elements.length ? 0 : currentElement + 1;
                                nextCard = nextCollection.cards.find(x => x.Id === nextCollection.elements[nextElement].cardId);
                                nextRulesToggle = false;
                                
                                if (nextCollection.elements[nextElement].faces) {
                                    nextCollection.faces = nextCollection.elements[nextElement].faces;
                                    nextFace = nextCollection.faces.findIndex(x => x === nextCard.Id);
                                }
                                else {
                                    nextCollection.faces = [];
                                    nextFace = -1;
                                }
                                
                                break;
                            case 'toggleRules':
                                nextRulesToggle = !rulesToggle;
                                nextArtToggle = false;

                                break;
                            case 'toggleArt':
                                nextRulesToggle = false;
                                nextArtToggle = !nextArtToggle;

                                break;
                            case 'clearComponents':
                                collector.stop('cancellation');
                                return;
                            default:
                                break;
                        }

                        Imbibe(context, nextCard, nextArtStyle, nextFace, nextElement, nextCollection, nextRulesToggle, nextArtToggle, nextMessage, nextSpoilerToggle);
                    });
                }
                else i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true});
            });

            collector.on('end', (i, reason) => {
                if (!spoilerToggle) {
                    let content = null;
                    let removeFiles = true;

                    if (reason === 'navigation') content = LOAD_APOLOGY;
                    else removeFiles = !artToggle;
                    
                    RemoveComponents(message, content, removeFiles);
                }
            });
        });
    }
    catch (e) {
        ReportError(context, e);
    }
}

let QueueCompiledResult = exports.QueueCompiledResult = async function(context, cards, message = null, missing = null, pageNumber = 0) {
    try {
        let spoilerOverride = (!context.guildId || (ConfigurationDao.CONFIGURATION.SpoilerExceptions[context.guildId] && ConfigurationDao.CONFIGURATION.SpoilerExceptions[context.guildId].includes(context.channelId)));

        let content = [];
        let overload = false;
        let navigationRow = new ActionRowBuilder();
        let subset = cards;
        
        if (cards.length > MAX_ATTACHMENTS) {
            overload = true;

            let startIndex = pageNumber * MAX_ATTACHMENTS;
            let endIndex = startIndex + MAX_ATTACHMENTS < cards.length ? startIndex + MAX_ATTACHMENTS : cards.length;
            let totalPages = Math.ceil(cards.length / MAX_ATTACHMENTS);
            
            subset = cards.slice(startIndex, endIndex);

            content.push(`**Page \`${pageNumber + 1}\` of \`${totalPages}\`** — Cards ${startIndex + 1} through ${endIndex}`);
            
            if (pageNumber > 1)
                navigationRow.addComponents(new ButtonBuilder()
                    .setCustomId('firstPage')
                    .setLabel(`First Page`)
                    .setStyle(ButtonStyle.Secondary));

            if (startIndex != 0)
                navigationRow.addComponents(new ButtonBuilder()
                    .setCustomId('previousPage')
                    .setLabel(`Previous Page`)
                    .setStyle(ButtonStyle.Primary));

            if (endIndex != cards.length)
                navigationRow.addComponents(new ButtonBuilder()
                    .setCustomId('nextPage')
                    .setLabel(`Next Page`)
                    .setStyle(ButtonStyle.Primary));

            if (totalPages > 2 && pageNumber < totalPages - 2)
                navigationRow.addComponents(new ButtonBuilder()
                    .setCustomId('lastPage')
                    .setLabel(`Last Page`)
                    .setStyle(ButtonStyle.Secondary));

            navigationRow.addComponents(new ButtonBuilder()
                .setCustomId('clearComponents')
                .setLabel('Clear Buttons')
                .setStyle(ButtonStyle.Danger));
        }
        
        let attachments = [];

        for (let card of subset) {
            attachments.push({
                attachment: BuildCardImagePath(card),
                name: `${(!spoilerOverride && card.SpoilerTag) ? 'SPOILER_' : ''}${card.Id}.jpg`,
                spoiler: (!spoilerOverride && card.SpoilerTag)
            });
        }

        if (missing) {
            let entry = `The following quer${missing.length === 1 ? 'y' : 'ies'} timed out, ${missing.length === 1 ? 'was' : 'were'} canceled, or returned no results:\n\`\`\``;
        
            for (let query of missing) {
                entry += `• ${query}\n`;
            }

            entry += '```';
        
            content.push(entry);
        }
        
        let messageOptions = {
            content: content.length ? content.join('\n\n') : null,
            components: overload ? [navigationRow] : [],
            embeds: [],
            files: attachments,
            fetchReply: true,
            failIfNotExists: false
        };

        let promise;
        
        if (message) promise = message.edit(messageOptions);
        else promise = context.channel.send(messageOptions);

        promise.then((message) => {
            if (!overload) {
                return;
            }

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: INTERACT_TIMEOUT * SECOND_MILLIS });

            collector.on('collect', i => {
                let userId = GetUserIdFromContext(context);

                if (i.user.id === userId) {
                    if (i.customId != 'clearComponents') collector.stop('navigation');

                    i.deferUpdate()
                    .then(async () => {
                        let nextPageNumber = pageNumber;

                        switch (i.customId) {
                            case 'firstPage':
                                nextPageNumber = 0;
                                                                
                                break;
                            case 'previousPage':
                                nextPageNumber = pageNumber - 1;
                                                                
                                break;
                            case 'nextPage':
                                nextPageNumber = pageNumber + 1;
                                
                                break;
                            case 'lastPage':
                                nextPageNumber = Math.ceil(cards.length / MAX_ATTACHMENTS) - 1;
                                
                                break;
                            case 'clearComponents':
                                collector.stop('cancellation');
                                return;
                            default:
                                break;
                        }

                        QueueCompiledResult(context, cards, message, missing, nextPageNumber);
                    });
                }
                else i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true});
            });

            collector.on('end', (i, reason) => {
                let content = null;
                let removeFiles = false;
                let removeContent = false;

                if (reason === 'navigation') {
                    content = LOAD_APOLOGY;
                    removeFiles = true;
                    removeContent = true;
                }
                
                RemoveComponents(message, content, removeFiles, removeContent);
            });
        });
    }
    catch(e) {
        ReportError(context, e);
    }
}