const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS } = require('../constants');
const { ConfigurationDao } = require('../dao/configurationDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { ChooseRandomElements } = require('../utilities/arrayHelper');
const { LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, Authorized } = require('../utilities/messageHelper');

const GenerateScenario = function(unofficial = false, goodies = true) {
    let scenarioChoices = SetDao.SETS.filter(x => (unofficial || x.Official) && x.CanSimulate && x.Type === 'Villain Set' && !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete);
    let randomScenario = ChooseRandomElements(scenarioChoices, 1)[0];
    
    let allModulars = randomScenario.Requires ? SetDao.SETS.filter(x => randomScenario.Requires.includes(x.Id)) : null;
    let modularText = '';

    if (randomScenario.Modulars) {
        let modularChoices = SetDao.SETS.filter(x => x.CanSimulate && x.Type === 'Modular Set' && (!randomScenario.Requires || !randomScenario.Requires.includes(x.Id)) && !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete);
        let randomModulars = ChooseRandomElements(modularChoices, randomScenario.Modulars);
    
        allModulars = allModulars ? allModulars.concat(randomModulars) : randomModulars;
    }

    if (allModulars) {
        allModulars = allModulars.sort((a, b) => a.Name > b.Name ? 1 : -1);

        switch(allModulars.length) {
            case 1:
                modularText = `**${allModulars[0].Name}**`;
                break;
            case 2:
                modularText = `**${allModulars[0].Name}** and **${allModulars[1].Name}**`;
                break;
            default:
                modularText = allModulars.map(x => allModulars.indexOf(x) === allModulars.length - 1 ? `and **${x.Name}**` : `**${x.Name}**`).join(', ');
                break;
        }
    }

    return '**DR**:> Rendering combat simulation...\n' +
        `**DR**:> Initiating **${randomScenario.Name}** protocol...` +
        (modularText ? `\n**DR**:> Importing ${modularText} hazard${allModulars.length > 1 ? 's' : ''}...` : '') +
        '\n**DR**:> Combat simulation rendered! Commence training!';
}

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

        let unofficial = false;

        if (context.guildId) {
            let restrictions = ConfigurationDao.CONFIGURATION.DangerRoomRestrictions[context.guildId];

            if (restrictions && !restrictions.includes(context.channelId)) {
                let replyEmbed = CreateEmbed(`Danger Room requests are restricted to the following channel${restrictions.length > 1 ? 's' : ''}:${restrictions.map(x => `\n<#${x}>`).join('')}`);
                
                await context.reply({
                    embeds:[replyEmbed],
                    ephemeral: true
                });

                return;
            }

            let whitelist = ConfigurationDao.CONFIGURATION.DangerRoomUnofficialWhitelist[context.guildId];

            if (whitelist && whitelist.includes(context.channelId)) {
                unofficial = true;
            }
        }
        
        try {
            let subCommand = context.options.getSubcommand();
            let heroesOption = context.options.getInteger('heroes');
            let command = `/danger-room`;

            new Promise(() => LogCommand(context, command, null));
            
            if (subCommand === 'mission') {
                let mission = GenerateScenario(unofficial);
                let replyEmbed = CreateEmbed(mission, COLORS.Encounter);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else {
                let replyEmbed = CreateEmbed('Not yet implemented! Stay tuned :two_hearts:');
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
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