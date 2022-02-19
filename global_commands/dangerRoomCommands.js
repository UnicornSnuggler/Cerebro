const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS, MASOCHIST } = require('../constants');
const { ConfigurationDao } = require('../dao/configurationDao');
const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');
const { ChooseRandomElements, CreateStringFromArray } = require('../utilities/arrayHelper');
const { RandomizeGlitches } = require('../utilities/dangerRoomHelper');
const { ReportError } = require('../utilities/errorHelper');
const { LogCommand } = require('../utilities/logHelper');
const { CreateEmbed, Authorized } = require('../utilities/messageHelper');
const { SuperscriptNumber } = require('../utilities/stringHelper');

const ContributionString = function(contributions) {
    let result = contributions.length > 0 ? '\n' : '';

    for (let i = 0; i < contributions.length; i++) {
        let contribution = contributions[i];
        result += `\n${SuperscriptNumber(i + 1)} **${contribution.packName}** by <@${contribution.authorId}>`;
    }

    return result;
}

const GlitchString = function(glitch) {
    return `\n**D**:> **ERR${glitch.code}** — ${glitch.summary}! *(${glitch.description})*`;
}

const TagUnofficial = function(contributions, packId) {
    let result = '';
    let index = contributions.findIndex(x => x.packId === packId);

    if (index !== -1) {
        result = ` ${SuperscriptNumber(index + 1)}`;
    }

    return result;
}

const GenerateScenario = function(unofficial = false, scenarioExclusions = null, modularExclusions = null, glitches = true) {
    let scenarioChoices = SetDao.SETS.filter(x =>
        (unofficial || x.Official) &&
        (!scenarioExclusions || !scenarioExclusions.includes(x.Id)) &&
        x.CanSimulate &&
        x.Type === 'Villain Set' &&
        !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete
    );

    let randomScenario = ChooseRandomElements(scenarioChoices, 1)[0];

    let pack = PackDao.PACKS.find(x => x.Id === randomScenario.PackId);
    
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

    let contributions = [];

    if (unofficial) {
        if (randomScenario.AuthorId) {
            contributions.push({
                authorId: randomScenario.AuthorId,
                packName: `${pack.Name} ${pack.Type}`,
                packId: pack.Id
            });
        }
    
        if (allModulars.length > 0) {
            for (let modular of allModulars) {
                if (modular.AuthorId && !contributions.includes(x => x.AuthorId === modular.AuthorId && x.PackId === modular.PackId)) {
                    let modularPack = PackDao.PACKS.find(x => x.Id === modular.PackId);

                    contributions.push({
                        authorId: modular.AuthorId,
                        packName: `${modularPack.Name} ${modularPack.Type}`,
                        packId: modularPack.Id
                    });
                }
            }
        }
    }

    return {
        scenario: randomScenario,
        modulars: allModulars,
        contributions: contributions
    };
}

const GenerateHero = function(unofficial = false, heroExclusions = null, aspectExclusions = null, glitches = true) {
    let heroChoices = SetDao.SETS.filter(x =>
        (unofficial || x.Official) &&
        (!heroExclusions || !heroExclusions.includes(x.Id)) &&
        x.CanSimulate &&
        x.Type === 'Hero Set' &&
        !PackDao.PACKS.find(y => y.Id === x.PackId).Incomplete
    );

    let randomHero = ChooseRandomElements(heroChoices, 1)[0];

    let pack = PackDao.PACKS.find(x => x.Id === randomHero.PackId);

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

    if (aspectExclusions && aspectChoices === 1) {
        aspects = aspects.filter(x => !aspectExclusions.includes(x));
    }

    let randomAspects = ChooseRandomElements(aspects, aspectChoices);
    randomAspects.sort((a, b) => a > b ? 1 : -1);

    let contributions = [];

    if (unofficial) {
        if (randomHero.AuthorId) {
            contributions.push({
                authorId: randomHero.AuthorId,
                packName: `${pack.Name} ${pack.Type}`,
                packId: pack.Id
            });
        }
    
        if (randomAspects.includes('Determination')) {
            contributions.push({
                authorId: MASOCHIST,
                packName: 'Determination Supplements',
                packId: 'Determination'
            });
        }
    }

    return {
        hero: randomHero,
        aspects: randomAspects,
        contributions: contributions
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
        
        try {
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

            let subCommand = context.options.getSubcommand();
            let heroesOption = context.options.getInteger('heroes');
            let command = `/danger-room`;

            new Promise(() => LogCommand(context, command, null));
            
            if (subCommand === 'mission') {
                let results = [GenerateScenario(unofficial)];
                RandomizeGlitches(results, null);

                let content = '**D**:> Rendering combat simulation...' +
                    `\n**D**:> Loading **${results[0].scenario.Name}**${TagUnofficial(results[0].contributions, results[0].scenario.PackId)} protocol...` +
                    (results[0].modulars.length > 0 ? `\n**D**:> Importing ${CreateStringFromArray(results[0].modulars.map(x => `**${x.Name}**${TagUnofficial(results[0].contributions, x.PackId)}`))} hazard${results[0].modulars.length > 1 ? 's' : ''}...` : '') +
                    (results[0].glitch ? GlitchString(results[0].glitch) : '') +
                    '\n**D**:> Combat simulation rendered! Commence training!' +
                    ContributionString(results[0].contributions);

                let replyEmbed = CreateEmbed(content, COLORS.Encounter);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else if (subCommand === 'hero') {
                let results = [GenerateHero(unofficial)];
                RandomizeGlitches(null, results);

                let content = '**D**:> Processing bio-signature...' +
                    `\n**D**:> Identity verified!` +
                    `\n**D**:> Welcome back, **${results[0].hero.Name}**${TagUnofficial(results[0].contributions, results[0].hero.PackId)}!` +
                    `\n**D**:> Training requested in the field${results[0].aspects.length > 1 ? 's' : ''} of ${CreateStringFromArray(results[0].aspects.map(x => `**${x}**${x === 'Determination' ? TagUnofficial(results[0].contributions, x) : ''}`))}...` +
                    (results[0].glitch ? GlitchString(results[0].glitch) : '') +
                    ContributionString(results[0].contributions);

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

                let scenarioResults = [GenerateScenario(unofficial)];
                let heroResults = [];
                let contributions = scenarioResults[0].contributions.length > 0 ? scenarioResults[0].contributions : [];

                for (let i = 0; i < heroesOption; i++) {
                    let heroResult = GenerateHero(unofficial, heroResults.map(x => x.hero.Id), heroResults.filter(x => x.aspects.length === 1).map(x => x.aspects[0]));

                    heroResults.push(heroResult);
                    heroResult.contributions.forEach(x => {
                        if (!contributions.includes(x)) {
                            contributions.push(x);
                        }
                    });
                }

                RandomizeGlitches(scenarioResults, heroResults);

                let content = '**D**:> Initializing team training exercise...' +
                    `\n**D**:> Loading **${scenarioResults[0].scenario.Name}**${TagUnofficial(contributions, scenarioResults[0].scenario.PackId)} protocol...` +
                    (scenarioResults[0].modulars.length > 0 ? `\n**D**:> Importing ${CreateStringFromArray(scenarioResults[0].modulars.map(x => `**${x.Name}**${TagUnofficial(contributions, x.PackId)}`))} hazard${scenarioResults[0].modulars.length > 1 ? 's' : ''}...` : '') +
                    (scenarioResults[0].glitch ? GlitchString(scenarioResults[0].glitch) : '') +
                    '\n**D**:> Compiling team data...' +
                    `${heroResults.map(x => 
                        `\n**D**:> Assigning **${x.hero.Name}**${TagUnofficial(contributions, x.hero.PackId)} to the team, specializing in ` +
                        `${CreateStringFromArray(x.aspects.map(y => `**${y}**${y === 'Determination' ? TagUnofficial(contributions, y) : ''}`))}...` +
                        (x.glitch ? GlitchString(x.glitch) : '')
                    ).join('')}` +
                    '\n**D**:> Team training exercise initialized!' +
                    ContributionString(contributions);

                let replyEmbed = CreateEmbed(content, COLORS.Justice);
    
                await context.reply({
                   embeds:[replyEmbed]
                });
            }
            else if (subCommand === 'challenge') {
                let scenarioResults = [];
                let modularExclusions = [];
                let heroResults = [];
                let contributions = [];

                for (let i = 0; i < 4; i++) {
                    let scenarioResult = GenerateScenario(unofficial, scenarioResults.map(x => x.scenario.Id), modularExclusions);

                    scenarioResults.push(scenarioResult);
                    scenarioResult.contributions.forEach(x => {
                        if (!contributions.includes(x)) {
                            contributions.push(x);
                        }
                    });

                    modularExclusions = modularExclusions.concat(scenarioResult.modulars.map(x => x.Id));
                }

                for (let i = 0; i < 4; i++) {
                    let heroResult = GenerateHero(unofficial, heroResults.map(x => x.hero.Id), ['Determination']);

                    heroResults.push(heroResult);
                }

                heroResults.sort((a, b) => a.hero.Name > b.hero.Name ? 1 : -1);

                for (let heroResult of heroResults) {
                    heroResult.contributions.forEach(x => {
                        if (!contributions.includes(x)) {
                            contributions.push(x);
                        }
                    });
                }

                let content = '**D**:> Executing [CLOBBERIN\'] challenge subroutine...' +
                    '\n**D**:> Performing threat analysis...' +
                    `${scenarioResults.map(x => `\n**D**:> *Threat ${scenarioResults.indexOf(x) + 1}* — **${x.scenario.Name}**${TagUnofficial(contributions, x.scenario.PackId)}${x.modulars.length > 0 ? `, bearing ${CreateStringFromArray(x.modulars.map(x => `**${x.Name}**${TagUnofficial(contributions, x.PackId)}`))}` : ''}.`).join('')}` +
                    '\n**D**:> Computing viable responders...' +
                    `\n**D**:> Available heroes include ${CreateStringFromArray(heroResults.map(x => `**${x.hero.Name}**${TagUnofficial(contributions, x.hero.PackId)}`))}!` +
                    '\n**D**:> Challenge mode subroutine executed! Good luck!' +
                    ContributionString(contributions);

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
            ReportError(context, e);
        }
    }
}