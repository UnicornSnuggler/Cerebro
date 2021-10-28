using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Cerebro_Utilities.Utilities
{
    public static class QueryHelper
    {
        public enum FlagNames
        {
            Bare,
            Wildcard,
            Fuzzy
        };

        private const string _forbidden = @"[-.!{}()]";

        public static string BuildWildcardQuery(string input)
        {
            input = EscapeQuery(input, " ");

            List<string> tokens = input.Split(" ", StringSplitOptions.RemoveEmptyEntries).ToList();

            return string.Join(" AND ", tokens.Select(x => $"/.*{x}.*/"));
        }

        public static string EscapeQuery(string input, string replacement = null)
        {
            MatchCollection matches = Regex.Matches(input, _forbidden, RegexOptions.IgnoreCase);

            foreach (Match match in matches)
            {
                input = input.Replace(match.Value, replacement ?? $"\\{match.Value}");
            }

            return input.Replace("*", "");
        }
    }
}
