require('dotenv').config()
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const globalCommands = [];
const globalCommandFiles = fs.readdirSync('./global_commands').filter(file => file.endsWith('.js'));

for (const globalCommandFile of globalCommandFiles) {
	const globalCommand = require(`./global_commands/${globalCommandFile}`);
	globalCommands.push(globalCommand.data.toJSON());
}

const guildCommands = [];
const guildCommandFiles = fs.readdirSync('./guild_commands').filter(file => file.endsWith('.js'));

for (const guildCommandFile of guildCommandFiles) {
	const guildCommand = require(`./guild_commands/${guildCommandFile}`);
	guildCommands.push(guildCommand.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.discordToken);

(async () => {
    try {
        console.log('Started reloading application global commands...');

        await rest.put(Routes.applicationCommands(process.env.clientId), { body: globalCommands });

        console.log('Successfully reloaded application global commands!');
        console.log('======');
        console.log('Started reloading application guild commands...');

        for (var guildId of process.env.guildIds.split(', ')) {
            await rest.put(Routes.applicationGuildCommands(process.env.clientId, guildId), { body: guildCommands });
        }

        console.log('Successfully reloaded application guild commands!');
    }
    catch (error) {
        console.error(error);
    }
})();