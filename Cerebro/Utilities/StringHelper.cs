using Cerebro_Utilities.Dao;
using Cerebro_Utilities.Models;
using DSharpPlus;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Cerebro.Utilities
{
    public static class StringHelper
    {
        public static string BuildImagePath(string root, string text)
        {
            return $"{root}{text}.png";
        }

        public static string FormatSymbols(string text)
        {
            return Constants.SYMBOLS.Aggregate(text, (filter, entry) => filter.Replace(entry.Key, entry.Value));
        }

        public static string FormatText(string text, string exclusion = null)
        {
            List<KeyValuePair<string, string>> replacements = new List<KeyValuePair<string, string>>();

            foreach (string priority in new List<string>() { "Severe", "Exclusion", "High", "Medium", "Low" })
            {
                if (priority != "Exclusion")
                {
                    List<FormattingEntity> formattings = FormattingDao._formattings.FindAll(x => x.Priority == priority);

                    foreach (FormattingEntity formatting in formattings)
                    {
                        string matchedText = null;

                        if (formatting.Regex != null)
                        {
                            var match = Regex.Match(text, formatting.Regex);

                            if (match.Success)
                            {
                                matchedText = match.ToString();
                            }
                        }
                        else
                        {
                            if (text.Contains(formatting.Text))
                            {
                                matchedText = formatting.Text;
                            }
                        }

                        if (matchedText != null)
                        {
                            string replacedText = null;

                            if (formatting.PartitionKey == "Bold")
                            {
                                replacedText = Formatter.Bold(matchedText);
                            }
                            else if (formatting.PartitionKey == "Emphasis")
                            {
                                replacedText = Formatter.Bold(Formatter.Italic(matchedText));
                            }
                            else if (formatting.PartitionKey == "Italic")
                            {
                                replacedText = Formatter.Italic(matchedText);
                            }
                            else if (formatting.PartitionKey == "Override")
                            {
                                replacedText = formatting.Replacement ?? matchedText;
                            }

                            int index = replacements.Count;

                            replacements.Add(new KeyValuePair<string, string>($"{{{index}}}", replacedText));
                            text = text.Replace(matchedText, $"{{{index}}}");
                        }
                    }
                }
                else
                {
                    if (exclusion != null && text.Contains(exclusion))
                    {
                        int index = replacements.Count;

                        replacements.Add(new KeyValuePair<string, string>($"{{{index}}}", exclusion));
                        text = text.Replace(exclusion, $"{{{index}}}");
                    }
                }
            }

            for (int i = 0; i < replacements.Count; i++)
            {
                text = text.Replace(replacements[i].Key, replacements[i].Value);
            }

            return FormatSymbols(text);
        }
    }
}
