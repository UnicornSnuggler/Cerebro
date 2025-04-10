require('dotenv').config()
const { Client, Collection, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, inlineCode, ComponentType } = require('discord.js');
const { AuthorDao } = require('./dao/authorDao');
const { FormattingDao } = require('./dao/formattingDao');
const { GroupDao } = require('./dao/groupDao');
const { PackDao } = require('./dao/packDao');
const { RuleDao } = require('./dao/ruleDao');
const { SetDao } = require('./dao/setDao');
const { ArtificialInteraction } = require('./models/artificialInteraction');
const { SendContentAsEmbed, CreateEmbed, RemoveComponents } = require('./utilities/messageHelper');
const { DAY_MILLIS, SECOND_MILLIS, INTERACT_TIMEOUT, LOAD_APOLOGY, INTERACT_APOLOGY } = require('./constants')
const fs = require('fs');
const { cardOfTheDayLoop } = require('./utilities/cardOfTheDayHelper');
const { ConfigurationDao } = require('./dao/configurationDao');
const { CardDao } = require('./dao/cardDao');
const { ReportError } = require('./utilities/errorHelper');
const { QueueCompiledResult, CreateSelectBox } = require('./utilities/cardHelper');
const { LogCardResult, LogCommand } = require('./utilities/logHelper');
const { ArtistDao } = require('./dao/artistDao');
const { GetUserIdFromContext } = require('./utilities/userHelper');
const { deckOfTheWeekLoop } = require('./utilities/deckOfTheWeekHelper');

const client = new Client({ intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessagePolls, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });

client.commands = new Collection();
const globalCommandFiles = fs.readdirSync('./global_commands').filter(file => file.endsWith('.js'));

for (const globalCommandFile of globalCommandFiles) {
    const globalCommand = require(`./global_commands/${globalCommandFile}`);
    client.commands.set(globalCommand.data.name, globalCommand);
}

function millisUntilEight() {
    let now = new Date();
    let millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0) - now;

    if (millis < 0) millis += DAY_MILLIS;

    console.log(`There are ${millis/SECOND_MILLIS} seconds until the next 'Card of the Day' message...`);
    
    return millis;
}

function millisUntilMonday() {
    let now = new Date();
    let nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0);
    nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);

    let millis = nextMonday - now;

    if (millis < 0) millis += DAY_MILLIS * 7;

    console.log(`There are ${millis/SECOND_MILLIS} seconds until the next 'Deck of the Week' message...`);
    
    return millis;
}

client.on('ready', async () => {
    await ArtistDao.UpdateArtistList();
    await AuthorDao.RetrieveAllAuthors();
    await FormattingDao.RetrieveAllFormattings();
    await GroupDao.RetrieveAllGroups();
    await PackDao.RetrieveAllPacks();
    await RuleDao.RetrieveKeywordsAndSchemeIcons();
    await SetDao.RetrieveAllSets();
    await ConfigurationDao.RetrieveConfiguration();

    console.log(`Logged in as ${client.user.tag}!`);

    setTimeout(function() {
        cardOfTheDayLoop(client);
        setInterval(function() {
            cardOfTheDayLoop(client);
        }, DAY_MILLIS)
    }, millisUntilEight());

    setTimeout(function() {
        deckOfTheWeekLoop(client);
        setInterval(function() {
            deckOfTheWeekLoop(client);
        }, DAY_MILLIS * 7)
    }, millisUntilMonday());
});

client.on('messageCreate', context => {
    if (context.author.bot) return;

    if (context.mentions.users.find(x => x === client.user)) {
        context.react('💕');
    }

    let queries = [];

    let matches = context.content.match(/({{.+?}}|<<.+?>>)/gi);

    if (matches) {
        for (let match of matches) {
            queries.push({
                match: match.replace(/[<>{}]/gmi, ''),
                official: new RegExp(/{{.+?}}/gi).test(match)
            });
        }
    }

    if (queries.length > 1) {
        PromptForConsolidation(context, queries);
    }
    else {
        HandleCardQueries(context, queries);
    }

    let officialRuleMatches = context.content.match(/\(\(.+?\)\)/gi);

    if (officialRuleMatches) {
        const command = client.commands.get('rule');
        
        for (let match of officialRuleMatches) {
            context.options = new ArtificialInteraction(true, match.replace(/[()]/gmi, ''));

            try {
                command.execute(context);
            }
            catch (error) {
                console.error(error);
                
                SendContentAsEmbed(context, 'There was an error while executing this command!', true);
            }
        }
    }
});

client.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        command.execute(interaction);
    }
    catch (error) {
        console.error(error);

        SendContentAsEmbed(interaction, 'There was an error while executing this command!', true);
    }
});

const PromptForConsolidation = async function(context, matches) {
    let components = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId('separate')
            .setLabel('Separate')
            .setStyle(ButtonStyle.Primary))
        .addComponents(new ButtonBuilder()
            .setCustomId('together')
            .setLabel('Together')
            .setStyle(ButtonStyle.Primary))
        .addComponents(new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger));

    let promise = SendContentAsEmbed(context, 'Multiple queries were detected! Would you like the results to be displayed separately or together?', [components]);

    promise.then((message) => {
        let collector = message.createMessageComponentCollector({ time: INTERACT_TIMEOUT * SECOND_MILLIS });

        collector.on('collect', async i => {
            let userId = GetUserIdFromContext(context);

            if (i.user.id === userId) {
                if (i.customId === 'separate') {
                    collector.stop('selection');

                    HandleCardQueries(context, matches);
                }
                if (i.customId === 'together') {
                    collector.stop('selection');

                    HandleBatchQuery(context, matches);
                }
                else {
                    collector.stop('cancel');
                }
            }
            else {
                i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true})
            }
        });

        collector.on('end', (i, reason) => {
            let content;

            if (reason === 'selection') {
                message.delete();
                return;
            }
            else if (reason === 'cancel') content = 'Selection was canceled...';
            else content = 'The timeout was reached...';
            
            RemoveComponents(message, content);
        });
    });
}

const HandleCardQueries = async function(context, queries) {
    const command = client.commands.get('card');

    for (let query of queries) {
        context.options = new ArtificialInteraction(query.official, query.match);

        try {
            command.execute(context);
        }
        catch (error) {
            console.error(error);
            
            SendContentAsEmbed(context, 'There was an error while executing this command!', true);
        }
    }
}

const HandleBatchQuery = async function(context, queries) {
    new Promise(() => LogCommand(context, "/batch", null));

    let cards = [];
    let missing = [];

    for (let query of queries) {
        let results = await ExecuteCardQuery(context, query.match, query.official);

        if (results) {
            cards = cards.concat(results);
        }
        else {
            missing.push(`${query.match} (${query.official ? 'O' : 'Uno'}fficial)`);
        }
    }

    if (cards) {
        let message = await SendContentAsEmbed(context, LOAD_APOLOGY);

        QueueCompiledResult(context, cards, message, missing.length ? missing : null);
    }
}

const ExecuteCardQuery = async function(context, query, official = true) {    
    if (!query.match(/([a-z0-9])/gi)) {
        SendContentAsEmbed(context, `${inlineCode(query)} is not a valid query...`);
        return null;
    }

    let origin = official ? 'official' : 'unofficial';
    let results = await CardDao.RetrieveByName(query, origin);

    if (!results || results.length === 0) return null;
    else if (results.length === 1) {
        new Promise(() => LogCardResult(context, results[0]));

        return results;
    }
    else if (results.length > 1) {
        let choice = await SelectBox(context, results);

        return choice;
    }
}

const SelectBox = async function(context, cards) {
    try {
        let prompt = `${cards.length} results were found for the given query!`;
        let items = cards;

        if (cards.length > 25) {
            items = cards.slice(0, 25);
            prompt += ' Only the top 25 results could be shown.';
        }

        prompt += '\n\nPlease select from the following...';

        let selector = CreateSelectBox(items);

        let selectMenuRow = new ActionRowBuilder().addComponents(selector);
        let buttonRow = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId('showAll')
                .setLabel('Show All')
                .setStyle(ButtonStyle.Primary))
            .addComponents(new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel Selection')
                .setStyle(ButtonStyle.Danger));

        let message = await SendContentAsEmbed(context, prompt, [selectMenuRow, buttonRow]);        
        let choice = null;
        let escape = false;

        while (choice === null && !escape) {
            await message.awaitMessageComponent({ time: INTERACT_TIMEOUT * SECOND_MILLIS })
                .then(i => {
                    let userId = GetUserIdFromContext(context);
            
                    if (i.user.id === userId) {
                        if (i.componentType === ComponentType.Button) {
                            if (i.customId === 'showAll') {
                                choice = cards;
                            }
                            else {
                                escape = true;
                            }
                        }
                        else {
                            let card = items.find(x => x.Id === i.values[0]);
            
                            new Promise(() => LogCardResult(context, card));
                            
                            choice = [card];
                        }
                    }
                    else {
                        i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true});
                    }
                })
                .catch(i => {
                    escape = true;
                });
        }

        message.delete();

        return choice;
    }
    catch (e) {
        ReportError(context, e);
    }
}

client.login(process.env.discordToken);