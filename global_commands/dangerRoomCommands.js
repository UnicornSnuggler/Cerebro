const { SlashCommandBuilder } = require('@discordjs/builders');
const { CreateEmbed, Authorized } = require('../utilities/messageHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('danger-room')
        .setDescription('Initiate a Danger Room simulation.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('mission')
                .setDescription('Simulate a scenario to fight against.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('hero')
                .setDescription('Simulate a hero to fight with.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('team-up')
                .setDescription('Simulate a scenario to fight against and any number of heroes to fight with.')
                .addIntegerOption(option =>
                    option
                        .setName('heroes')
                        .setDescription('The number of heroes to generate.')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription('Simulate the ultimate training exercise.')),
    async execute(context) {
        if (!Authorized(context)) return;
        
        try {
            let replyEmbed = CreateEmbed('Not yet implemented! Stay tuned :two_hearts:');

            await context.reply({
               embeds:[replyEmbed]
            });
        }
        catch (e) {
            console.log(e);

            let replyEmbed = CreateEmbed('Something went wrong... Check the logs to find out more.');

            await context.channel.send({
                embeds: [replyEmbed]
            });
        }
    }
}