const { Formatters } = require('discord.js');
const { FormattingDao } = require('../dao/formattingDao');
const { SYMBOLS } = require('../constants');

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
                let matchedText = null;

                if (formatting.Regex) {
                    let match = text.match(formatting.Match);

                    matchedText = match ? match[0] : null;
                }
                else if (text.includes(formatting.Match)) matchedText = formatting.Match;

                if (matchedText) {
                    let replacedText = null;

                    if (formatting.Operation == 'Bold') replacedText = Formatters.bold(matchedText);
                    else if (formatting.Operation == 'Emphasis') replacedText = Formatters.bold(ItalicizeText(matchedText));
                    else if (formatting.Operation == 'Italic') replacedText = ItalicizeText(matchedText);
                    else if (formatting.Operation == 'Override') replacedText = formatting.Replacement ? formatting.Replacement : matchedText;

                    let index = Object.keys(replacements).length;

                    replacements[`{${index}}`] = replacedText;
                    text = text.replaceAll(matchedText, `{${index}}`);
                }
            }
        }
        else {
            if (exclusion && text.includes(exclusion)) {
                let index = Object.keys(replacements).length;

                replacements[`{${index}}`] = exclusion;
                text = text.replace(exclusion, `{${index}}`);
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

exports.SpoilerIfIncomplete = function(text, incomplete) {
    return incomplete ? Formatters.spoiler(text) : text;
}