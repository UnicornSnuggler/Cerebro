require('dotenv').config()
const { Client, Collection, Intents, Constants } = require('discord.js');
const { AuthorDao } = require('./dao/authorDao');
const { FormattingDao } = require('./dao/formattingDao');
const { GroupDao } = require('./dao/groupDao');
const { PackDao } = require('./dao/packDao');
const { RuleDao } = require('./dao/ruleDao');
const { SetDao } = require('./dao/setDao');
const { ArtificialInteraction } = require('./models/artificialInteraction');
const { SendContentAsEmbed } = require('./utilities/messageHelper');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], partials: [Constants.PartialTypes.CHANNEL] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.on('ready', async () => {
    await AuthorDao.RetrieveAllAuthors();
    await FormattingDao.RetrieveAllFormattings();
    await GroupDao.RetrieveAllGroups();
    await PackDao.RetrieveAllPacks();
    await RuleDao.RetrieveKeywordsAndSchemeIcons();
    await SetDao.RetrieveAllSets();

    console.log(`Logged in as ${client.user.tag}!`);
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

    let matches = message.content.match(/\{\{.+?\}\}/gi);

    if (matches) {
        const command = client.commands.get('card');
        
        for (let match of matches) {
            message.options = new ArtificialInteraction('name', true, match.replace(/[{}]/gmi, ''));

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                SendContentAsEmbed(message, 'There was an error while executing this command!', true);
            }
        }
    }

    matches = message.content.match(/<<.+?>>/gi);

    if (matches) {
        const command = client.commands.get('card');
        
        for (let match of matches) {
            message.options = new ArtificialInteraction('name', false, match.replace(/[<>]/gmi, ''));

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                SendContentAsEmbed(message, 'There was an error while executing this command!', true);
            }
        }
    }

    matches = message.content.match(/\(\(.+?\)\)/gi);

    if (matches) {
        const command = client.commands.get('rule');
        
        for (let match of matches) {
            message.options = new ArtificialInteraction('title', true, match.replace(/[()]/gmi, ''));

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