const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS, MASOCHIST } = require('../constants');
const { ConfigurationDao } = require('../dao/configurationDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { ChooseRandomElements, CreateString } = require('../utilities/arrayHelper');
const { LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, Authorized } = require('../utilities/messageHelper');

const GenerateScenario = function(unofficial = false, glitches = true) {
    let scenarioChoices = SetDao.SETS.filter(x => (unofficial || x.Official) && x.CanSimulate && x.Type === 'Villain Set' && !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete);
    let randomScenario = ChooseRandomElements(scenarioChoices, 1)[0];
    
    let allModulars = randomScenario.Requires ? SetDao.SETS.filter(x => randomScenario.Requires.includes(x.Id)) : [];

    if (randomScenario.Modulars) {
        let modularChoices = SetDao.SETS.filter(x => x.CanSimulate && x.Type === 'Modular Set' && (!randomScenario.Requires || !randomScenario.Requires.includes(x.Id)) && !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete);
        let randomModulars = ChooseRandomElements(modularChoices, randomScenario.Modulars);
    
        allModulars = allModulars ? allModulars.concat(randomModulars) : randomModulars;
    }

    allModulars.sort((a, b) => a.Name > b.Name ? 1 : -1);

    let contributors = [];

    if (unofficial) {
        if (randomScenario.AuthorId) {
            contributors.push(`<@${randomScenario.AuthorId}>`);
        }
    
        if (allModulars.length > 0) {
            for (let modular of allModulars) {
                if (modular.AuthorId && !contributors.includes(`<@${modular.AuthorId}>`)) {
                    contributors.push(`<@${modular.AuthorId}>`);
                }
            }
        }
    }

    return {
        scenario: randomScenario,
        modulars: allModulars,
        contributors: contributors
    };
}

const GenerateHero = function(unofficial = false, heroExclusions = null, aspectExclusions = null, glitches = true) {
    let heroChoices = SetDao.SETS.filter(x => (unofficial || x.Official) && (!heroExclusions || !heroExclusions.includes(x.Id)) && x.CanSimulate && x.Type === 'Hero Set' && !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete);
    let randomHero = ChooseRandomElements(heroChoices, 1)[0];

    let aspectChoices = 1;

    if (randomHero.Deviation) {
        switch (randomHero.Name) {
            case 'Adam Warlock':
                aspectChoices = 4;
                break;
            case 'Spider-Woman':
                aspectChoices = 2;
                break;
            default:
                break;
        }
    }

    let aspects = ['Aggression', 'Justice', 'Leadership', 'Protection'];

    if (unofficial) {
        aspects.push('Determination');
    }

    if (aspectExclusions) {
        aspects = aspects.filter(x => !aspectExclusions.includes(x));
    }

    let randomAspects = ChooseRandomElements(aspects, aspectChoices);
    randomAspects.sort((a, b) => a > b ? 1 : -1);

    let contributors = [];

    if (unofficial) {
        if (randomHero.AuthorId) {
            contributors.push(`<@${randomHero.AuthorId}>`);
        }
    
        if (randomAspects.includes('Determination') && randomHero.AuthorId !== MASOCHIST) {
            contributors.push(`<@${MASOCHIST}>`);
        }
    }

    return {
        hero: randomHero,
        aspects: randomAspects,
        contributors: contributors
    };
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
                let result = GenerateScenario(unofficial);

                let content = '**DR**:> Rendering combat simulation...' +
                    `\n**DR**:> Loading **${result.scenario.Name}** protocol...` +
                    (result.modulars.length > 0 ? `\n**DR**:> Importing ${CreateString(result.modulars.map(x => x.Name), '**')} hazard${result.modulars.length > 1 ? 's' : ''}...` : '') +
                    '\n**DR**:> Combat simulation rendered! Commence training!' +
                    (result.contributors.length > 0 ? `\n**DR**:> Consult ${CreateString(result.contributors)} for mission details...` : '');

                let replyEmbed = CreateEmbed(content, COLORS.Encounter);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else if (subCommand === 'hero') {
                let result = GenerateHero(unofficial);

                let content = '**DR**:> Processing bio-signature...' +
                    `\n**DR**:> Identity verified!` +
                    `\n**DR**:> Welcome back, **${result.hero.Name}**!` +
                    `\n**DR**:> Training requested in the field${result.aspects.length > 1 ? 's' : ''} of ${CreateString(result.aspects, '**')}...` +
                    (result.contributors.length > 0 ? `\n**DR**:> Consult ${CreateString(result.contributors)} for mission details...` : '');

                let replyEmbed = CreateEmbed(content, COLORS.Hero);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else if (subCommand === 'team-up') {
                if (heroesOption < 1 || heroesOption > 4) {
                    let replyEmbed = CreateEmbed(`You must specify a number of heroes between 1 and 4...`);
                    
                    await context.reply({
                        embeds:[replyEmbed],
                        ephemeral: true
                    });
    
                    return;
                }

                let scenarioResult = GenerateScenario(unofficial);
                let heroResults = [];
                let contributors = scenarioResult.contributors.length > 0 ? scenarioResult.contributors : [];

                for (let i = 0; i < heroesOption; i++) {
                    let heroResult = GenerateHero(unofficial, heroResults.map(x => x.hero.Id), heroResults.filter(x => x.aspects.length === 1).map(x => x.aspects[0]));

                    heroResults.push(heroResult);
                    heroResult.contributors.forEach(x => {
                        if (!contributors.includes(x)) {
                            contributors.push(x);
                        }
                    });
                }

                let content = '**DR**:> Initializing team training exercise...' +
                    `\n**DR**:> Loading **${scenarioResult.scenario.Name}** protocol...` +
                    (scenarioResult.modulars.length > 0 ? `\n**DR**:> Importing ${CreateString(scenarioResult.modulars.map(x => x.Name), '**')} hazard${scenarioResult.modulars.length > 1 ? 's' : ''}...` : '') +
                    '\n**DR**:> Compiling team data...' +
                    `${heroResults.map(x => `\n**DR**:> Assigning **${x.hero.Name}** to the team, specializing in ${CreateString(x.aspects, '**')}...`).join('')}` +
                    '\n**DR**:> Team training exercise initialized!' +
                    (contributors.length > 0 ? `\n**DR**:> Consult ${CreateString(contributors)} for mission details...` : '');

                let replyEmbed = CreateEmbed(content, COLORS.Justice);
    
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