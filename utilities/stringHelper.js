const { bold, spoiler } = require('discord.js');
const { FormattingDao } = require('../dao/formattingDao');
const { SYMBOLS } = require('../constants');

const superscriptCharacters = {
	0: '\u2070',
	1: '\u00B9',
	2: '\u00B2',
	3: '\u00B3',
	4: '\u2074',
	5: '\u2075',
	6: '\u2076',
	7: '\u2077',
	8: '\u2078',
	9: '\u2079'
};

exports.CapitalizedTitleElement = function(element) {
    return element === 'all-time' ? 'All-Time' : element.charAt(0).toUpperCase() + element.slice(1);
}

exports.EscapeRegex = function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let FormatSymbols = exports.FormatSymbols = function(text) {
    for (let key in SYMBOLS) text = text.replaceAll(key, SYMBOLS[key]);

    return text;
}

exports.FormatText = function(text, exclusion = null) {
    let replacements = {};

    for (let priority of ['Severe', 'Exclusion', 'High', 'Medium', 'Low']) {
        if (priority != 'Exclusion') {
            let formattings = FormattingDao.FORMATTINGS.filter(x => x.Priority == priority);

            for (let formatting of formattings) {
                let matches = {};

                let search = formatting.Regex ? new RegExp(formatting.Match, 'g') : formatting.Match;

                let output = text.replaceAll(search, m => {
                    let key = `{${Object.keys(replacements).length + Object.keys(matches).length}}`;
                    
                    matches[key] = m;

                    return key;
                });

                for (let key of Object.keys(matches)) {
                    let replacedText = null;

                    switch (formatting.Operation) {
                        case 'Bold':
                            replacedText = bold(matches[key]);
                            break;
                        case 'Emphasis':
                            replacedText = bold(ItalicizeText(matches[key]));
                            break;
                        case 'Italic':
                            replacedText = ItalicizeText(matches[key]);
                            break;
                        case 'Override':
                            replacedText = formatting.Replacement ? formatting.Replacement : matches[key];
                            break;
                    }

                    replacements[key] = replacedText;
                }
                
                text = output;
            }
        }
        else {
            if (exclusion && text.includes(exclusion)) {
                let index = Object.keys(replacements).length;

                replacements[`{${index}}`] = exclusion;
                text = text.replaceAll(exclusion, `{${index}}`);
            }
        }
    }

    for (let key of Object.keys(replacements)) text = text.replaceAll(key, replacements[key]);

    return FormatSymbols(text);
}

const ItalicizeText = exports.ItalicizeText = function(text) {
    return `*${text}*`;
}

exports.QuoteText = function(text) {
    return text.split('\n').map(line => `> ${line}`).join('\n');
}

exports.SpoilerIfSpoilerTagged = function(text, spoilerTag) {
    return spoilerTag ? spoiler(text) : text;
}

exports.SuperscriptNumber = function(number) {
	return number.toString().split('').map(x => superscriptCharacters[x] ?? '').join('');
}