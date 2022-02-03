const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS, MASOCHIST } = require('../constants');
const { ConfigurationDao } = require('../dao/configurationDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { ChooseRandomElements, CreateString } = require('../utilities/arrayHelper');
const { LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, Authorized } = require('../utilities/messageHelper');

const GenerateScenario = function(unofficial = false, scenarioExclusions = null, modularExclusions = null, glitches = true) {
    let scenarioChoices = SetDao.SETS.filter(x => 
        (unofficial || x.Official) && 
        (!scenarioExclusions || !scenarioExclusions.includes(x.Id)) && 
        x.CanSimulate && 
        x.Type === 'Villain Set' && 
        !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete
    );

    let randomScenario = ChooseRandomElements(scenarioChoices, 1)[0];
    
    let allModulars = randomScenario.Requires ? SetDao.SETS.filter(x => randomScenario.Requires.includes(x.Id)) : [];

    if (randomScenario.Modulars) {
        let modularChoices = SetDao.SETS.filter(x => 
            (unofficial || x.Official) && 
            (!modularExclusions || !modularExclusions.includes(x.Id)) && 
            x.CanSimulate && 
            x.Type === 'Modular Set' && 
            (!randomScenario.Requires || !randomScenario.Requires.includes(x.Id)) && 
            !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete
        );
        
        let randomModulars = ChooseRandomElements(modularChoices, randomScenario.Modulars);
    
        allModulars = allModulars.concat(randomModulars);
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

                let content = '**D**:> Rendering combat simulation...' +
                    `\n**D**:> Loading **${result.scenario.Name}** protocol...` +
                    (result.modulars.length > 0 ? `\n**D**:> Importing ${CreateString(result.modulars.map(x => x.Name), '**')} hazard${result.modulars.length > 1 ? 's' : ''}...` : '') +
                    '\n**D**:> Combat simulation rendered! Commence training!' +
                    (result.contributors.length > 0 ? `\n**D**:> Consult ${CreateString(result.contributors)} for mission details...` : '');

                let replyEmbed = CreateEmbed(content, COLORS.Encounter);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else if (subCommand === 'hero') {
                let result = GenerateHero(unofficial);

                let content = '**D**:> Processing bio-signature...' +
                    `\n**D**:> Identity verified!` +
                    `\n**D**:> Welcome back, **${result.hero.Name}**!` +
                    `\n**D**:> Training requested in the field${result.aspects.length > 1 ? 's' : ''} of ${CreateString(result.aspects, '**')}...` +
                    (result.contributors.length > 0 ? `\n**D**:> Consult ${CreateString(result.contributors)} for mission details...` : '');

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

                let content = '**D**:> Initializing team training exercise...' +
                    `\n**D**:> Loading **${scenarioResult.scenario.Name}** protocol...` +
                    (scenarioResult.modulars.length > 0 ? `\n**D**:> Importing ${CreateString(scenarioResult.modulars.map(x => x.Name), '**')} hazard${scenarioResult.modulars.length > 1 ? 's' : ''}...` : '') +
                    '\n**D**:> Compiling team data...' +
                    `${heroResults.map(x => `\n**D**:> Assigning **${x.hero.Name}** to the team, specializing in ${CreateString(x.aspects, '**')}...`).join('')}` +
                    '\n**D**:> Team training exercise initialized!' +
                    (contributors.length > 0 ? `\n**D**:> Consult ${CreateString(contributors)} for mission details...` : '');

                let replyEmbed = CreateEmbed(content, COLORS.Justice);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else if (subCommand === 'challenge') {
                let scenarioResults = [];
                let modularExclusions = [];
                let heroResults = [];
                let contributors = [];

                for (let i = 0; i < 4; i++) {
                    let scenarioResult = GenerateScenario(unofficial, scenarioResults.map(x => x.scenario.Id), modularExclusions);

                    scenarioResults.push(scenarioResult);
                    scenarioResult.contributors.forEach(x => {
                        if (!contributors.includes(x)) {
                            contributors.push(x);
                        }
                    });

                    modularExclusions = modularExclusions.concat(scenarioResult.modulars.map(x => x.Id));

                    let heroResult = GenerateHero(unofficial, heroResults.map(x => x.hero.Id), heroResults.filter(x => x.aspects.length === 1).map(x => x.aspects[0]));

                    heroResults.push(heroResult);
                    heroResult.contributors.forEach(x => {
                        if (!contributors.includes(x)) {
                            contributors.push(x);
                        }
                    });
                }

                heroResults.sort((a, b) => a.hero.Name > b.hero.Name ? 1 : -1);

                let content = '**D**:> Executing challenge mode subroutine...' +
                    '\n**D**:> Performing threat analysis...' +
                    `${scenarioResults.map(x => `\n**D**:> *Threat ${scenarioResults.indexOf(x) + 1}* — **${x.scenario.Name}**${x.modulars.length > 0 ? `, bearing ${CreateString(x.modulars.map(x => x.Name), '**')}` : ''}.`).join('')}` +
                    '\n**D**:> Computing viable responders...' +
                    `\n**D**:> Available heroes include ${CreateString(heroResults.map(x => x.hero.Name), '**')}!` +
                    '\n**D**:> Challenge mode subroutine executed! Good luck!' +
                    (contributors.length > 0 ? `\n**D**:> Consult ${CreateString(contributors)} for mission details...` : '');

                let replyEmbed = CreateEmbed(content, COLORS.Aggression);
    
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