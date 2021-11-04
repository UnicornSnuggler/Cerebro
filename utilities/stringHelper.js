const { Formatters } = require('discord.js');
const { SYMBOLS } = require('../constants');
const { FormattingDao } = require('../dao/formattingDao');

exports.BuildImagePath = function(root, text) {
    return `${root}${text}.png`;
}

var FormatSymbols = exports.FormatSymbols = function(text) {
    for (var key in SYMBOLS) text = text.replaceAll(key, SYMBOLS[key]);

    return text;
}

exports.FormatText = function(text, exclusion = null) {
    var replacements = {};

    for (var priority of ['Severe', 'Exclusion', 'High', 'Medium', 'Low']) {
        if (priority != 'Exclusion') {
            var formattings = FormattingDao.FORMATTINGS.filter(x => x.Priority == priority);

            for (var formatting of formattings) {
                var matchedText = null;

                if (formatting.Regex) {
                    var match = text.match(formatting.Regex);

                    matchedText = match ? match[0] : null;
                }
                else if (text.includes(formatting.Text)) matchedText = formatting.Text;

                if (matchedText) {
                    var replacedText = null;

                    if (formatting.Operation == 'Bold') replacedText = Formatters.bold(matchedText);
                    else if (formatting.Operation == 'Emphasis') replacedText = Formatters.bold(ItalicizeText(matchedText));
                    else if (formatting.Operation == 'Italic') replacedText = ItalicizeText(matchedText);
                    else if (formatting.Operation == 'Override') replacedText = formatting.Replacement ? formatting.Replacement : matchedText;

                    var index = Object.keys(replacements).length;

                    replacements[`{${index}}`] = replacedText;
                    text = text.replaceAll(matchedText, `{${index}}`);
                }
            }
        }
        else {
            if (exclusion && text.includes(exclusion)) {
                var index = Object.keys(replacements).length;

                replacements[`{${index}}`] = exclusion;
                text = text.replace(exclusion, `{${index}}`);
            }
        }
    }

    for (var key of Object.keys(replacements)) text = text.replaceAll(key, replacements[key]);

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