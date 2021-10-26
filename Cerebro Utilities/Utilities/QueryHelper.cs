using Lucene.Net.Analysis.Standard;
using Lucene.Net.QueryParsers.Classic;
using System.Collections.Generic;
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

        public static Dictionary<FlagNames, string> QueryFlags = new Dictionary<FlagNames, string>()
        {
            { FlagNames.Bare, "" },
            { FlagNames.Wildcard, "*" },
            { FlagNames.Fuzzy, "~" },
        };

        public static string LuceneQuery(string input)
        {
            const string FIELD = "field";

            return new QueryParser(Lucene.Net.Util.LuceneVersion.LUCENE_48, FIELD, new StandardAnalyzer(Lucene.Net.Util.LuceneVersion.LUCENE_48))
                .Parse(Regex.Replace(input, @"[\!\{\}]", " "))
                .ToString(FIELD);
        }
    }
}
