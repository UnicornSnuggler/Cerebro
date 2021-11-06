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