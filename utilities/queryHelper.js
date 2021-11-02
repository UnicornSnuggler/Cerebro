exports.FlagNames = {
    BARE: "bare",
    WILDCARD: "wildcard",
    FUZZY: "fuzzy"
};

var EscapeQuery = exports.EscapeQuery = function(input, replacement = null)
{
    input = input.replace(/([-.!{}()])/gmi, replacement ?? "\\$1");

    return input.replaceAll("*", "");
};

exports.BuildWildcardQuery = function(input)
{
    input = EscapeQuery(input, " ");

    var tokens = input.split(" ").filter(function(x) { return x.trim().length > 0; });

    return tokens.map(x => `/.*${x}.*/`).join(' AND ');
};