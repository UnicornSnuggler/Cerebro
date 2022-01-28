require('dotenv').config()
const { Client, Collection, Intents, Constants } = require('discord.js');
const { AuthorDao } = require('./dao/authorDao');
const { FormattingDao } = require('./dao/formattingDao');
const { GroupDao } = require('./dao/groupDao');
const { PackDao } = require('./dao/packDao');
const { RuleDao } = require('./dao/ruleDao');
const { SetDao } = require('./dao/setDao');
const { ArtificialInteraction } = require('./models/artificialInteraction');
const { SendContentAsEmbed, CreateEmbed } = require('./utilities/messageHelper');
const { SERVER_CONFIG, COLORS, DAY_MILLIS } = require('./constants')
const fs = require('fs');
const { CardDao } = require('./dao/cardDao');
const { BuildCardImagePath, GetPrintingByArtificialId } = require('./utilities/cardHelper');
const { LogDao } = require('./dao/logDao');
const { GetDateString } = require('./utilities/dateHelper');

const client = new Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], partials: [Constants.PartialTypes.CHANNEL] });

client.commands = new Collection();
const globalCommandFiles = fs.readdirSync('./global_commands').filter(file => file.endsWith('.js'));

for (const globalCommandFile of globalCommandFiles) {
    const globalCommand = require(`./global_commands/${globalCommandFile}`);
    client.commands.set(globalCommand.data.name, globalCommand);
}

const guildCommandFiles = fs.readdirSync('./guild_commands').filter(file => file.endsWith('.js'));

for (const guildCommandFile of guildCommandFiles) {
    const guildCommand = require(`./guild_commands/${guildCommandFile}`);
    client.commands.set(guildCommand.data.name, guildCommand);
}

function millisUntilEight() {
    let now = new Date();
    let millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0) - now;

    if (millis < 0) millis += DAY_MILLIS;

    console.log(`There are ${millis/1000} seconds until the first 'Card of the Day' message...`);
    
    return millis;
}

async function cardOfTheDay() {
    let card = await CardDao.RetrieveRandomCard();
    let queryCount = await LogDao.RetrieveLogCountByCardId(card.Id);
    let firstPrinting = GetPrintingByArtificialId(card, card.Id);
    let pack = PackDao.PACKS.find(x => x.Id === firstPrinting.PackId);
    let reprints = card.Printings.length - 1;
    
    let codEmbed = CreateEmbed(`The **Card of the Day** is [${card.Name}](${BuildCardImagePath(card)})!\n\n` +
        `This card first debuted in the **${pack.Name}${pack.Type !== 'Core Set' ? ` ${pack.Type}` : ''}**.\n` +
        `${reprints > 0 ? `It has since been reprinted ${reprints} time${reprints === 1 ? '' : 's'}.` : 'It has never been reprinted.'}\n\n` +
        `${queryCount > 0 ? `Cerebro users have collectively queried for this card ${queryCount} time${queryCount === 1 ? '' : 's'}.` : 'Cerebro users have never queried for this card.'}`,
        COLORS[card.Classification],
        `Card of the Day — ${GetDateString()}`
    );

    codEmbed.setImage(BuildCardImagePath(card));

    for (let [guildId, channelIdList] of Object.entries(SERVER_CONFIG.CardOfTheDay)) {
        let guild = client.guilds.resolve(guildId);

        if (guild) {
            channelIdList.forEach(channelId => {
                let channel = guild.channels.resolve(channelId);

                if (channel) {
                    let permissions = guild.me.permissionsIn(channelId);
    
                    if (permissions.has('VIEW_CHANNEL') && permissions.has('SEND_MESSAGES') && permissions.has('MANAGE_MESSAGES')) {
                        channel.send({
                            embeds: [codEmbed]
                        });
                    }
                }
            });
        }
    }
}

client.on('ready', async () => {
    await AuthorDao.RetrieveAllAuthors();
    await FormattingDao.RetrieveAllFormattings();
    await GroupDao.RetrieveAllGroups();
    await PackDao.RetrieveAllPacks();
    await RuleDao.RetrieveKeywordsAndSchemeIcons();
    await SetDao.RetrieveAllSets();

    console.log(`Logged in as ${client.user.tag}!`);

    setTimeout(function() {
        cardOfTheDay();
        setInterval(function() {
            cardOfTheDay();
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

    let matches = message.content.match(/\{\{.+?\}\}/gi);

    if (matches) {
        const command = client.commands.get('card');
        
        for (let match of matches) {
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

    matches = message.content.match(/<<.+?>>/gi);

    if (matches) {
        const command = client.commands.get('card');
        
        for (let match of matches) {
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

    matches = message.content.match(/\(\(.+?\)\)/gi);

    if (matches) {
        const command = client.commands.get('rule');
        
        for (let match of matches) {
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