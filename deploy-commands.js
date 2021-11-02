const configResult = require('dotenv').config()
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.discordToken);

(async () => {
    try {
        console.log('Started refreshing global application commands...');

        await rest.put(
            Routes.applicationCommands(process.env.clientId),
            { body: commands },
        );

        console.log('Successfully reloaded global application commands!');
    } catch (error) {
        console.error(error);
    }
})();