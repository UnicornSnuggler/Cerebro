const { GLITCH_CHANCE, DONOR_GLITCH_CHANCE, MASOCHIST } = require("../constants");
const { PackDao } = require("../dao/packDao");
const { SetDao } = require("../dao/setDao");
const { ChooseRandomElements } = require("./arrayHelper");

const GLITCH_FILTERS = {
    mustHaveModulars: 0,
    onlyOneAspect: 1,
    moreThanOneAspect: 2
};

const GLITCHES = [
    {
        code: 032,
        summary: 'Isolation protocol',
        description: 'You may not include any non-identity-specific allies during deck-building.',
        hero: true,
        filters: null
    },
    {
        code: 106,
        summary: 'Memory partition corruption',
        description: 'You must only include cards from one of your assigned aspects during deck-building. Ignore any deck-building requirements specified by your assigned identity.',
        hero: true,
        filters: [
            GLITCH_FILTERS.moreThanOneAspect
        ]
    },
    {
        code: 129,
        summary: 'Cerebral enhancement',
        description: 'Your identity gains the ***Psionic*** trait.',
        hero: true,
        filters: null
    },
    {
        code: 207,
        summary: 'Training curriculum overload',
        description: 'You may choose an additional aspect. If you do, you must include an equal number of cards from that aspect and your assigned aspect in your deck.',
        hero: true,
        filters: [
            GLITCH_FILTERS.onlyOneAspect
        ]
    },
    {
        code: 252,
        summary: 'Symbiotic stowaway',
        description: 'You start the game with a copy of the Symbiote Suit upgrade in play. After resolving scheme setup, set your hit point dial to half of your identity\'s maximum hit points *(rounded down)*.',
        hero: true,
        filters: null
    },
    {
        code: 273,
        summary: 'Assault on the homefront',
        description: 'You start the game with a copy of the Avengers Mansion support in play. After resolving scheme setup, exhaust and confuse your identity.',
        hero: true,
        filters: null
    },
    {
        code: 404,
        summary: 'Specialization not found',
        description: 'You must only include **Basic** aspect cards in your deck. Ignore any deck-building requirements specified by your assigned identity.',
        hero: true,
        filters: null
    },
    {
        code: 636,
        summary: 'Multiversal entity',
        description: 'The unique rule does not apply to you or cards you control.',
        hero: true,
        filters: null
    },
    {
        code: 963,
        summary: 'Gravitational fluctuation',
        description: 'Your identity gains the ***Aerial*** trait.',
        hero: true,
        filters: null
    },
    {
        code: 115,
        summary: 'Adamantium theft',
        description: 'Each minion enters play with a tough status card.',
        hero: false,
        filters: null
    },
    {
        code: 333,
        summary: 'Power imbalance',
        description: 'Set up the villain(s) as though you were playing on standard mode, but include the expert modular set when creating the encounter deck.',
        hero: false,
        filters: [
            GLITCH_FILTERS.mustHaveModulars
        ]
    },
    {
        code: 351,
        summary: 'Power imbalance',
        description: 'Set up the villain(s) as though you were playing on expert mode, but do not include the expert modular set when creating the encounter deck.',
        hero: false,
        filters: [
            GLITCH_FILTERS.mustHaveModulars
        ]
    },
    {
        code: 666,
        summary: 'Summoning ritual',
        description: 'After resolving scheme setup, discard cards from the top of the encounter deck until a minion is discarded and put that minion into play engaged with the first player. Then, shuffle the encounter discard pile into the encounter deck.',
        hero: false,
        filters: null
    },
    {
        code: 683,
        summary: 'Delayed response time',
        description: 'After resolving scheme setup, place 1 acceleration token on the main scheme.',
        hero: false,
        filters: null
    },
    {
        code: 777,
        summary: 'Stroke of luck',
        description: 'After resolving scheme setup, find the Shadow of the Past treachery and remove it from the game.',
        hero: false,
        filters: null
    },
    {
        code: 827,
        summary: 'Ambush override',
        description: 'After resolving scheme setup, stun and confuse the villain.',
        hero: false,
        filters: null
    }
];

exports.GenerateHero = function(unofficial = false, heroExclusions = null, aspectExclusions = null, glitches = true) {
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

exports.RandomizeGlitches = function(scenarios, heroes, donor = false) {
    let now = new Date();
    let foolish = now.getDate() == 1 && now.getMonth() == 3;

    let randomNumber = Math.random();
    let chance = (donor ? DONOR_GLITCH_CHANCE : GLITCH_CHANCE) * (foolish ? 10 : 1) / 100;

    if (randomNumber > chance) {
        return;
    }

    let glitchPool = [];
    let glitch = null;
    let choiceId = null;

    if (scenarios) {
        glitchPool = glitchPool.concat(GLITCHES.filter(x => !x.hero));
    }
    
    if (heroes) {
        glitchPool = glitchPool.concat(GLITCHES.filter(x => x.hero));
    }

    while (glitchPool.length > 0 && !glitch) {
        let randomIndex = Math.floor(Math.random() * glitchPool.length);
        let choice = glitchPool[randomIndex];
        let comparator = choice.hero ? heroes : scenarios;

        if (!choice.filters) {
            let randomChoice = Math.floor(Math.random() * comparator.length);

            choiceId = comparator[randomChoice][choice.hero ? 'hero' : 'scenario'].Id;
            glitch = choice;

            break;
        }
        else {
            let options = comparator.filter(x => {
                if ((!choice.hero && !x.modulars) || (choice.filters.includes(GLITCH_FILTERS.mustHaveModulars) && x.modulars.length === 0)) {
                    return false;
                }

                if ((choice.hero && !x.aspects) || (choice.filters.includes(GLITCH_FILTERS.onlyOneAspect) && x.aspects.length !== 1)) {
                    return false;
                }

                if ((choice.hero && !x.aspects) || (choice.filters.includes(GLITCH_FILTERS.moreThanOneAspect) && x.aspects.length <= 1)) {
                    return false;
                }

                return true;
            });

            if (options.length > 0) {
                let randomChoice = Math.floor(Math.random() * options.length);

                choiceId = options[randomChoice][choice.hero ? 'hero' : 'scenario'].Id;
                glitch = choice;

                break;
            }
            else {
                glitchPool.splice(randomIndex, 1);

                continue;
            }
        }
    }

    if (glitch) {
        if (glitch.hero) {
            heroes.find(x => x.hero.Id === choiceId).glitch = glitch;
        }
        else {
            scenarios.find(x => x.scenario.Id === choiceId).glitch = glitch;
        }
    }
}