require('dotenv').config()
const { Client, Collection, Intents, Constants } = require('discord.js');
const { AuthorDao } = require('./dao/authorDao');
const { FormattingDao } = require('./dao/formattingDao');
const { GroupDao } = require('./dao/groupDao');
const { PackDao } = require('./dao/packDao');
const { RuleDao } = require('./dao/ruleDao');
const { SetDao } = require('./dao/setDao');
const { ArtificialInteraction } = require('./models/artificialInteraction');
const { SendContentAsEmbed, SendMessageWithOptions } = require('./utilities/messageHelper');
const { DAY_MILLIS, SECOND_MILLIS } = require('./constants')
const fs = require('fs');
const { cardOfTheDayLoop } = require('./utilities/cardOfTheDayHelper');
const { ConfigurationDao } = require('./dao/configurationDao');

const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS], partials: [Constants.PartialTypes.CHANNEL] });

client.commands = new Collection();
const globalCommandFiles = fs.readdirSync('./global_commands').filter(file => file.endsWith('.js'));

for (const globalCommandFile of globalCommandFiles) {
    const globalCommand = require(`./global_commands/${globalCommandFile}`);
    client.commands.set(globalCommand.data.name, globalCommand);
}

// const guildCommandFiles = fs.readdirSync('./guild_commands').filter(file => file.endsWith('.js'));

// for (const guildCommandFile of guildCommandFiles) {
//     const guildCommand = require(`./guild_commands/${guildCommandFile}`);
//     client.commands.set(guildCommand.data.name, guildCommand);
// }

function millisUntilEight() {
    let now = new Date();
    let millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0) - now;

    if (millis < 0) millis += DAY_MILLIS;

    console.log(`There are ${millis/SECOND_MILLIS} seconds until the first 'Card of the Day' message...`);
    
    return millis;
}

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

client.on('messageCreate', message => {
    HandleMessages(message);
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

const HandleMessages = function(message) {
    if (message.author.bot) return;

    if (message.mentions.users.find(x => x === client.user)) {
        message.react('💕');
    }

    let officialCardMatches = message.content.match(/\{\{.+?\}\}/gi);

    if (officialCardMatches) {
        const command = client.commands.get('card');
        
        for (let match of officialCardMatches) {
            message.options = new ArtificialInteraction(true, match.replace(/[{}]/gmi, ''));

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                SendContentAsEmbed(message, 'There was an error while executing this command!', true);
            }
        }
    }

    let unofficialCardMatches = message.content.match(/<<.+?>>/gi);

    if (unofficialCardMatches) {
        const command = client.commands.get('card');
        
        for (let match of unofficialCardMatches) {
            message.options = new ArtificialInteraction(false, match.replace(/[<>]/gmi, ''));

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                SendContentAsEmbed(message, 'There was an error while executing this command!', true);
            }
        }
    }

    let officialRuleMatches = message.content.match(/\(\(.+?\)\)/gi);

    if (officialRuleMatches) {
        const command = client.commands.get('rule');
        
        for (let match of officialRuleMatches) {
            message.options = new ArtificialInteraction(true, match.replace(/[()]/gmi, ''));

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                SendContentAsEmbed(message, 'There was an error while executing this command!', true);
            }
        }
    }
}

client.login(process.env.discordToken);