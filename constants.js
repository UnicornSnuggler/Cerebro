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

exports.STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
}

exports.FILTERS = [
    {
        'verbose': 'authorid',
        'shorthand': 'au',
        'property': 'AuthorId'
    },
    {
        'verbose': 'boost',
        'shorthand': 'b',
        'property': 'Boost'
    },
    {
        'verbose': 'cost',
        'shorthand': 'co',
        'property': 'Cost'
    },
    {
        'verbose': 'classification',
        'shorthand': 'cl',
        'property': 'Classification'
    },
    {
        'verbose': 'groupid',
        'shorthand': 'gi',
        'property': 'GroupId'
    },
    {
        'verbose': 'id',
        'shorthand': 'd',
        'property': 'id()'
    },
    {
        'verbose': 'incomplete',
        'shorthand': 'i',
        'property': 'Incomplete'
    },
    {
        'verbose': 'name',
        'shorthand': 'n',
        'property': 'Name'
    },
    {
        'verbose': 'official',
        'shorthand': 'o',
        'property': 'Official'
    },
    {
        'verbose': 'packid',
        'shorthand': 'pi',
        'property': 'PackIds'
    },
    {
        'verbose': 'resource',
        'shorthand': 're',
        'property': 'Resource'
    },
    {
        'verbose': 'rules',
        'shorthand': 'ru',
        'property': 'Rules'
    },
    {
        'verbose': 'setid',
        'shorthand': 'si',
        'property': 'SetIds'
    },
    {
        'verbose': 'special',
        'shorthand': 'sp',
        'property': 'Special'
    },
    {
        'verbose': 'subname',
        'shorthand': 'sn',
        'property': 'Subname'
    },
    {
        'verbose': 'traits',
        'shorthand': 'tr',
        'property': 'Traits'
    },
    {
        'verbose': 'type',
        'shorthand': 'ty',
        'property': 'Type'
    }
];

exports.IMAGE_WIDTH = 300;
exports.IMAGE_HEIGHT = 423;
exports.MAX_ATTACHMENTS = 10;

exports.DEFAULT_ART_TOGGLE = true;

exports.WIZARD = '132708937584607233';
exports.ACOLYTE = '906244686476345344';
exports.MASOCHIST = '583884764084305920';

exports.PRODUCTION_BOT = '895469977602236426';

exports.DAY_MILLIS = 86400000;
exports.MINUTE_MILLIS = 60000;
exports.SECOND_MILLIS = 1000;

exports.INTERACT_TIMEOUT = 60;
exports.SELECT_TIMEOUT = 45;
exports.PROMPT_TIMEOUT = 5;

exports.ID_LENGTH = 5;

exports.DONOR_GLITCH_CHANCE = 7;
exports.GLITCH_CHANCE = 3;

exports.ALL = 'all';
exports.OFFICIAL = 'official';
exports.UNOFFICIAL = 'unofficial';

exports.FALSE = 'false';
exports.TRUE = 'true';

exports.DM_APOLOGY = 'Sorry, but you can\'t view server statistics in a direct message...';
exports.INTERACT_APOLOGY = 'Sorry, but you can\'t interact with another user\'s messages...';
exports.LOAD_APOLOGY = 'Please wait while result details are being retrieved. Art rendering will likely result in longer load times.';
exports.STATISTICS_APOLOGY = 'Please wait while pertinent data is being retrieved...';
exports.TIMEOUT_APOLOGY = 'The interaction timeout was reached...';

exports.DUPLICATE_CODE = 11000;
exports.VALIDATION_CODE = 121;

exports.BAD_ID_APOLOGY = 'The object ID provided is not a valid object ID...';
exports.DUPLICATE_APOLOGY = 'The provided email address has already been used to create an existing user object...';
exports.ID_NOT_FOUND_APOLOGY = 'The object ID provided was not found...';
exports.UNAUTHORIZED_APOLOGY = 'The \'Authorization\' header must be populated with a valid bearer token...';
exports.UNKNOWN_APOLOGY = 'An unknown error occurred...';
exports.VALIDATION_APOLOGY = 'One or more schema validation issues were found...';

exports.ARTIST_EMOJI = ':paintbrush:'
exports.RELEASED_EMOJI = '<:affirmative:939594005317025832>';
exports.REVIEWING_EMOJI = ':mag:';
exports.TINKERER_EMOJI = '<:tinkerer_seal:939594700078317568>';
exports.UNRELEASED_EMOJI = '<:negative:939594004985683990> ';
exports.WARNING_EMOJI = ':warning:';

exports.SYMBOLS = {
    '{a}': '<:mc_acceleration:939593942800932974>',
    '{b}': '<:mc_boost:939593942431838320>',
    '{c}': '<:mc_crisis:939593942821929081>',
    '{d}': '<:mc_consequential:939593942784172072>',
    '{e}': '<:mc_energy:939593942893211688>',
    '{h}': '<:mc_hazard:939593942993891398>',
    '{i}': '<:mc_players:939593943291658250>',
    '{m}': '<:mc_mental:939593942951931904>',
    '{p}': '<:mc_physical:939593942800932915>',
    '{s}': '<:mc_star:939593943035826257>',
    '{u}': '<:mc_unique:939593943069380740>',
    '{w}': '<:mc_wild:939593942830305321>',
    '{x}': '<:mc_mutant_genesis:984586842475221062>',
    '{y}': '<:mc_amplify:939593942788374648>'
};

exports.ERROR_MESSAGES = [
    `These are not the URLs you're looking for...`,
    `You've reached the void of space...`,
    `You need to work on your typing skills...`,
    `The page that was here is mad at you and doesn't want to see you right now...`,
    `You don't belong here...`,
    `This URL ain't big enough for the two of us...`,
    `I would do anything for you...but I won't do that...`,
    `I'd like to speak to your manager...`,
    `Do you realize what you've done?! ...nothing. This page doesn't exist...`,
    `I'm afraid this is the end of the line for you, bucko...`,
    `Do you feel lucky, punk? Well...you shouldn't...`
];