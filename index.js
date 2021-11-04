const configResult = require('dotenv').config()
const { Client, Collection, Intents } = require('discord.js');
const { SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const { FormattingDao } = require('./dao/formattingDao');
const { GroupDao } = require('./dao/groupDao');
const { PackDao } = require('./dao/packDao');
const { RuleDao } = require('./dao/ruleDao');
const { SetDao } = require('./dao/setDao');
const MessageHelper = require('./utilities/messageHelper');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
exports.indexClient = new SearchIndexClient(process.env.searchUri, new AzureKeyCredential(process.env.apiKey));

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.on('ready', async () => {
    await FormattingDao.RetrieveAllFormattings();
    await GroupDao.RetrieveAllGroups();
    await PackDao.RetrieveAllPacks();
    await RuleDao.RetrieveKeywordsAndSchemeIcons();
    await SetDao.RetrieveAllSets();

    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;

    var matches = message.content.match(/\{\{.+?\}\}/gi);

    if (matches) {
        const command = client.commands.get('card');
        
        message.options = {};
        message.options._subcommand = 'name';
        
        for (var match of matches) {
            message.options._hoistedOptions = [{
                name: 'terms',
                type: 'STRING',
                value: match.replace(/[{}]/gmi, '')
            }];

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                MessageHelper.SendContentAsEmbed(message, 'There was an error while executing this command!', true);
            }
        }
    }

    var matches = message.content.match(/\(\(.+?\)\)/gi);

    if (matches) {
        const command = client.commands.get('rule');
        
        message.options = {};
        message.options._subcommand = 'title';
        
        for (var match of matches) {
            message.options._hoistedOptions = [{
                name: 'terms',
                type: 'STRING',
                value: match.replace(/[()]/gmi, '')
            }];

            try {
                command.execute(message);
            }
            catch (error) {
                console.error(error);
                
                MessageHelper.SendContentAsEmbed(message, 'There was an error while executing this command!', true);
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

        MessageHelper.SendContentAsEmbed(interaction, 'There was an error while executing this command!', true);
    }
});

client.login(process.env.discordToken);