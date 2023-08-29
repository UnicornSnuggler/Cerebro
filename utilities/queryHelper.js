const { FILTERS } = require("../constants");

exports.FlagNames = {
    BARE: "bare",
    WILDCARD: "wildcard",
    FUZZY: "fuzzy"
}

let EscapeQuery = exports.EscapeQuery = function(input, replacement = null) {
    input = input.replace(/([-.!{}()])/gmi, replacement ?? "\\$1");

    return input.replaceAll("*", "");
}

exports.BuildWildcardQuery = function(input) {
    input = EscapeQuery(input, " ");

    let tokens = input.split(" ").filter(function(x) { return x.trim().length > 0; });

    return tokens.map(x => `/.*${x}.*/`).join(' AND ');
}

exports.ValidateQuerySyntax = function(input) {
    let response = {
        result: false,
        output: ''
    };

    let replacements = {};

    input = input.replaceAll(/{[0-9]+?}|\r|\n/gmi, '');

    let illegalFilters = [];

    let filterStrippedString = input.toLowerCase().replaceAll(/(?<property>[a-z]+?):((?<!(?<!\\)\\)\"(?<query>.*?)(?<!(?<!\\)\\)\")/gmi, function(match, property, query) {
        let convertedProperty = FILTERS.find(x => x.verbose === property || x.shorthand === property);

        if (!convertedProperty) {
            illegalFilters.push(property);
        }
        
        let key = `{${Object.keys(replacements).length}}`;
        
        replacements[key] = match;

        return key;
    });

    if (illegalFilters.length !== 0) {
        response.output = `Illegal filters found: ${illegalFilters.map(x => `'${x}'`).join(', ')}`;

        return response;
    }

    filterStrippedString = filterStrippedString.replaceAll(' ', '');

    let errors = filterStrippedString.replace(/[()&|\-]|{[0-9]+}/gmi, '');

    if (errors.length !== 0) {
        response.output = `Illegal characters found: '${[...new Set([...errors])].join('')}'`;

        return response;
    }

    let parentheses = 0;

    for (let index = 0; index < filterStrippedString.length; index++) {
        let previousCharacter = index === 0 ? null : filterStrippedString[index - 1];
        let character = filterStrippedString[index];
        let nextCharacter = index === filterStrippedString.length - 1 ? null : filterStrippedString[index + 1];

        if (character === '(') {
            parentheses += 1;

            if (previousCharacter && !['(', '&', '|'].includes(previousCharacter)) {
                response.output = `Syntax error at index '${index}': '${previousCharacter}${character}'`;

                return response;
            }

            if (nextCharacter && !['(', '{'].includes(nextCharacter)) {
                response.output = `Syntax error at index '${index + 1}': '${character}${nextCharacter}'`;

                return response;
            }
        }
        else if (character === ')') {
            if (parentheses > 0) {
                parentheses -= 1;

                if (previousCharacter && ![')', '}'].includes(previousCharacter)) {
                    response.output = `Syntax error at index '${index}': '${previousCharacter}${character}'`;
    
                    return response;
                }

                if (nextCharacter && ![')', '&', '|'].includes(nextCharacter)) {
                    response.output = `Syntax error at index '${index + 1}': '${character}${nextCharacter}'`;
    
                    return response;
                }
            }
            else {
                response.output = `Erroneous closing parenthesis found at index '${index}'...`;

                return response;
            }
        }
        else if (character === '-') {
            if (!nextCharacter) {
                response.output = `Syntax error at index '${index}': '${character}'`;

                return response;
            }

            if (!['(', '{'].includes(nextCharacter)) {
                response.output = `Syntax error at index '${index + 1}': '${character}${nextCharacter}'`;

                return response;
            }
        }
        else if (['&', '|'].includes(character)) {
            if (!previousCharacter || !nextCharacter) {
                response.output = `Syntax error at index '${index}': '${character}'`;

                return response;
            }
            
            if (![')', '}'].includes(previousCharacter)) {
                response.output = `Syntax error at index '${index}': '${previousCharacter}${character}'`;
                
                return response;
            }

            if (!['(', '{', '-'].includes(nextCharacter)) {
                response.output = `Syntax error at index '${index + 1}': '${character}${nextCharacter}'`;

                return response;
            }
        }
    }

    if (parentheses !== 0) {
        response.output = 'Unbalanced parentheses...';

        return response;
    }

    for (let key of Object.keys(replacements)) {
        filterStrippedString = filterStrippedString.replaceAll(key, replacements[key]);
    }

    response.result = true;
    response.output = filterStrippedString;

    return response;
}