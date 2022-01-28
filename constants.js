exports.COLORS = {
    Default: '4F80C2',
    Aggression: 'FF3D3D',
    Basic: 'DFDFDF',
    Determination: 'AC60CC',
    Encounter: 'FF9100',
    Hero: '2337CF',
    Justice: 'F9FC26',
    Leadership: '67CAFE',
    Protection: '6BEE5E',
    Villain: 'BA00D6'
};

exports.SERVER_CONFIG = {
    CardOfTheDay: {
        '660715546274430994': {         // All the Nerd Things
            role: null,
            channels: [
                '793879881812541440'    // #developer-stuff
            ]
        },
        '387054806528688134': {         // Lemonsbottest
            role: '936658501101555762', // Card of the Day
            channels: [
                '903745628797018192',   // #cerebro
                '903791106913869856'    // #cerebro-beta
            ]
        },
        '641317998442971146': {         // Marvel Champions LCG Homebrew
            role: null,
            channels: [                     
                '896999311710232586'    // #cerebro
            ]
        },
        '607399156780105741': {         // Marvel Champions LCG Community Server
            role: '936657267590316072', // Card of the Day
            channels: [
                '936656891411562606'    // #card-of-the-day
            ]
        }
    },
    SpoilerExceptions: {
        '387054806528688134': [   // Lemonsbottest
            '936361526284144640', // #cerebro-beta-spoilers
            '936361456755179620'  // #cerebro-spoilers
        ],
        '641317998442971146': [   // Marvel Champions LCG Homebrew
            '710144027789623416', // #spoiler-discussion-cards
            '825206371451404288'  // #spoiler-discussion-others
        ],
        '740664734071652403': [   // Solo Champions League
            '756227996469297173'  // #upcoming-releases
        ]
    },
    UnofficialRestrictions: {
        '387054806528688134': [   // Lemonsbottest
            '936326825079083009', // #cerebro-beta-unofficial
            '936326004723576962'  // #cerebro-unofficial
        ],
        '607399156780105741': [   // Marvel Champions LCG Community Server
            '747860006174457947'  // #homebrew
        ]
    }
};

exports.DAY_MILLIS = 86400000;
exports.ID_LENGTH = 5;
exports.INTERACT_TIMEOUT = 30;
exports.SELECT_TIMEOUT = 45;

exports.OFFICIAL = 'official';
exports.UNOFFICIAL = 'unofficial';

exports.DM_APOLOGY = 'Sorry, but you can\'t view server statistics in a direct message...';
exports.INTERACT_APOLOGY = 'Sorry, but you can\'t interact with another user\'s query result...';
exports.LOAD_APOLOGY = 'Please wait while result details are being retrieved. Art rendering will likely result in longer load times.';

exports.RELEASED_EMOJI = '<:released:906312522804654200>';
exports.REVIEWING_EMOJI = ':mag:';
exports.TINKERER_EMOJI = '<:tinkerer_seal:934102800491757668>';
exports.UNRELEASED_EMOJI = '<:unreleased:906312522859155487>';
exports.WARNING_EMOJI = ':warning:';

exports.SYMBOLS = {
    '{a}': '<:mc_acceleration:896032683266809876>',
    '{y}': '<:mc_amplify:898957049000505354>',
    '{b}': '<:mc_boost:896031377701629953>',
    '{d}': '<:mc_consequential:896032683266834432>',
    '{c}': '<:mc_crisis:896032682901913621>',
    '{e}': '<:mc_energy:896032683396837376>',
    '{h}': '<:mc_hazard:896032683384266822>',
    '{m}': '<:mc_mental:896032683384262706>',
    '{p}': '<:mc_physical:896032683442995221>',
    '{i}': '<:mc_players:896032683476520980>',
    '{s}': '<:mc_star:896032683480739860>',
    '{u}': '<:mc_unique:896031377919733760>',
    '{w}': '<:mc_wild:896032683589779476>'
};