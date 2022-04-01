require('dotenv').config()
const { Client, Collection, Intents, Constants, MessageActionRow, MessageButton, Formatters } = require('discord.js');
const { AuthorDao } = require('./dao/authorDao');
const { FormattingDao } = require('./dao/formattingDao');
const { GroupDao } = require('./dao/groupDao');
const { PackDao } = require('./dao/packDao');
const { RuleDao } = require('./dao/ruleDao');
const { SetDao } = require('./dao/setDao');
const { ArtificialInteraction } = require('./models/artificialInteraction');
const { SendContentAsEmbed, CreateEmbed, RemoveComponents } = require('./utilities/messageHelper');
const { DAY_MILLIS, SECOND_MILLIS, INTERACT_TIMEOUT, LOAD_APOLOGY, INTERACT_APOLOGY, SELECT_TIMEOUT } = require('./constants')
const fs = require('fs');
const { cardOfTheDayLoop } = require('./utilities/cardOfTheDayHelper');
const { ConfigurationDao } = require('./dao/configurationDao');
const { CardDao } = require('./dao/cardDao');
const { ReportError } = require('./utilities/errorHelper');
const { QueueCompiledResult, CreateSelectBox, ResourceConverter } = require('./utilities/cardHelper');
const { LogCardResult, LogCommand } = require('./utilities/logHelper');
const express = require('express');

const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS], partials: [Constants.PartialTypes.CHANNEL] });
const app = express();

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

    console.log(`There are ${millis/SECOND_MILLIS} seconds until the first 'Card of the Day' message...`);
    
    return millis;
}

app.get('/cards', async function(req, res) {
    let results = [];

    let origin = 'official';

    let aspectOption = req.query.aspect;
    let aspect = aspectOption ? aspectOption.toLowerCase() : null;

    let author = req.query.author;

    let cost = req.query.cost;

    let nameOption = req.query.name;
    let name = nameOption ? nameOption.toLowerCase() : null;

    let resourceOption = req.query.resource;
    let resource = resourceOption ? resourceOption.toLowerCase() : null;

    let textOption = req.query.text;
    let text = textOption ? textOption.toLowerCase() : null;

    let traitsOption = req.query.traits;
    let traits = traitsOption ? traitsOption.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, '')) : null;

    let typeOption = req.query.type;
    let type = typeOption ? typeOption.toLowerCase() : null;

    if (name && name.match(/([a-z0-9])/gi)) {
        results = await CardDao.RetrieveByName(name, origin, false);

        if (results) {
            if (aspect) results = results.filter(card => card.Classification.toLowerCase() === aspect);
            if (author) results = results.filter(card => card.AuthorId === author);
            if (cost) results = results.filter(card => card.Cost && card.Cost.toLowerCase() === cost);
            if (resource) {
                if (resource === 'none') {
                    results = results.filter(card => !card.Resource);
                }
                else {
                    results = results.filter(card => card.Resource && card.Resource.toLowerCase().includes(ResourceConverter[resource]));
                }
            }
            if (text) results = results.filter(card => (card.Rules && card.Rules.toLowerCase().includes(text)) || (card.Special && card.Special.toLowerCase().includes(text)));
            if (traits) results = results.filter(card => card.Traits && traits.every(element => card.Traits.find(trait => trait.toLowerCase() === element.trim())));
            if (type) results = results.filter(card => card.Type.toLowerCase() === type);
        }
    }
    else {
        results = await CardDao.RetrieveWithFilters(origin, aspect, author, cost, resource, text, traits, type, false);
    }

    res.end(JSON.stringify(results));
});

var server = app.listen(8081, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port);
});

client.on('ready', async () => {
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
    let components = new MessageActionRow()
        .addComponents(new MessageButton()
            .setCustomId('separate')
            .setLabel('Separate')
            .setStyle('PRIMARY'))
        .addComponents(new MessageButton()
            .setCustomId('together')
            .setLabel('Together')
            .setStyle('PRIMARY'))
        .addComponents(new MessageButton()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle('DANGER'));

    let promise = SendContentAsEmbed(context, 'Multiple queries were detected! Would you like the results to be displayed separately or together?', [components]);

    promise.then((message) => {
        let collector = message.createMessageComponentCollector({ time: INTERACT_TIMEOUT * SECOND_MILLIS });

        collector.on('collect', async i => {
            let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;

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

    for (let query of queries) {
        let results = await ExecuteCardQuery(context, query.match, query.official);

        if (results) {
            cards = cards.concat(results);
        }
        else {
            return;
        }
    }

    if (cards) {
        let message = await SendContentAsEmbed(context, LOAD_APOLOGY);

        QueueCompiledResult(context, cards, message);
    }
}

const ExecuteCardQuery = async function(context, query, official = true) {    
    if (!query.match(/([a-z0-9])/gi)) {
        SendContentAsEmbed(context, `${Formatters.inlineCode(query)} is not a valid query...`);
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

        let selectMenuRow = new MessageActionRow().addComponents(selector);
        let buttonRow = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId('showAll')
                .setLabel('Show All')
                .setStyle('PRIMARY'))
            .addComponents(new MessageButton()
                .setCustomId('cancel')
                .setLabel('Cancel Selection')
                .setStyle('DANGER'));

        let message = await SendContentAsEmbed(context, prompt, [selectMenuRow, buttonRow]);        
        let choice = message.awaitMessageComponent({ time: SELECT_TIMEOUT * SECOND_MILLIS })
            .then(i => {
                let results = null;
                let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;
        
                if (i.user.id === userId) {
                    if (i.componentType === 'BUTTON') {
                        if (i.customId === 'showAll') {
                            results = cards;

                            message.delete();
                        }
                        else {
                            RemoveComponents(message, 'Selection was canceled...');
                        }
                    }
                    else {
                        let card = items.find(x => x.Id === i.values[0]);
        
                        new Promise(() => LogCardResult(context, card));
                        
                        results = [card];
        
                        message.delete();
                    }
    
                    return results;
                }
                else {
                    i.reply({embeds: [CreateEmbed(INTERACT_APOLOGY)], ephemeral: true});
                }
            })
            .catch(_ => RemoveComponents(message, 'The timeout was reached...'));

        return choice;
    }
    catch (e) {
        ReportError(context, e);
    }
}

client.login(process.env.discordToken);