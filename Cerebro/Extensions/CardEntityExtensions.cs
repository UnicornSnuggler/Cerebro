using Cerebro_Utilities.Dao;
using Cerebro_Utilities.Models;
using DSharpPlus;
using DSharpPlus.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Cerebro.Extensions
{
    internal static class CardEntityExtensions
    {
        internal static DiscordEmbed BuildEmbed(this CardEntity card, string alternateArt = null)
        {
            var embed = new DiscordEmbedBuilder();

            StringBuilder description = new StringBuilder();
            List<string> subheader = new List<string>() { card.BuildHeader() };

            if (card.Traits != null)
            {
                subheader.Add(Formatter.Italic(Formatter.Bold(card.Traits)));
            }

            description.AppendLine(card.SpoilerIfIncomplete(string.Join("\n", subheader)));
            description.AppendLine();

            string stats = card.BuildStats();

            if (stats.Length > 0)
            {
                description.AppendLine(card.SpoilerIfIncomplete(FormatSymbols(stats)));
                description.AppendLine();
            }

            List<string> body = new List<string>();

            if (card.Rules != null)
            {
                body.Add(QuoteText(card.SpoilerIfIncomplete(FormatText(card.Rules, card.Name))));
            }

            if (card.Special != null)
            {
                body.Add(QuoteText(card.SpoilerIfIncomplete(FormatText(card.Special, card.Name))));
            }

            if (card.Flavor != null)
            {
                body.Add(card.SpoilerIfIncomplete(Formatter.Italic(Formatter.Sanitize(card.Flavor))));
            }

            if (body.Count > 0)
            {
                description.AppendLine(string.Join("\n\n", body));
            }

            embed.WithColor(Constants.COLORS.GetValueOrDefault(card.Type == "Villain" || card.Type == "Main Scheme" ? "Villain" : card.Classification, new DiscordColor("2337CF")));
            embed.WithTitle(card.SpoilerIfIncomplete((card.Unique ? Constants.UNIQUE_SYMBOL : "") + card.Name + (card.Subname != null ? $" — {card.Subname}" : "" )));
            embed.WithUrl(card.BuildImagePath(alternateArt));
            embed.WithDescription(description.ToString());
            embed.WithFooter(card.BuildFooter());
            
            if (!card.Incomplete)
            {
                embed.WithThumbnail(card.BuildImagePath(alternateArt));
            }

            return embed;
        }

        internal static string BuildFooter(this CardEntity card)
        {
            PrintingEntity firstPrinting = card.Printings.Find(x => x.RowKey == card.RowKey);
            List<PrintingEntity> reprints = card.Printings.FindAll(x => x.RowKey != card.RowKey);

            StringBuilder footer = new StringBuilder();
            footer.AppendLine(firstPrinting.Summary());

            if (reprints.Count > 0 && reprints.Count <= 3)
            {
                foreach (PrintingEntity printing in reprints)
                {
                    footer.AppendLine(printing.Summary());
                }
            }
            else if (reprints.Count > 3)
            {
                for (int i = 0; i < 2; i++)
                {
                    footer.AppendLine(reprints[i].Summary());
                }

                footer.AppendLine($"...and {reprints.Count - 2} more reprints.");
            }

            return footer.ToString();
        }

        internal static string BuildHeader(this CardEntity card, bool forChoices = false)
        {
            StringBuilder header = new StringBuilder();

            if (card.Classification != "Encounter" && card.Type != "Hero" && card.Type != "Alter-Ego")
            {
                header.Append($"{Formatter.Bold(card.Classification)} ");
            }

            header.Append(Formatter.Bold(card.Type));

            if (card.Stage != null)
            {
                if (!forChoices)
                {
                    header.Append($" — {Formatter.Italic($"Stage {card.Stage}")}");
                }
                else
                {
                    string packName = card.Printings.First().Pack.Name;
                    header.Append($" — {Formatter.Italic($"({packName})")}");
                }
            }

            return header.ToString();
        }

        internal static string BuildImagePath(this CardEntity card, string alternateArt = null)
        {
            return $"{Constants.IMAGE_PREFIX}{(alternateArt != null ? alternateArt : card.RowKey)}.png";
        }

        internal static DiscordEmbed BuildRulesEmbed(this CardEntity card, Dictionary<string, string> rules, string alternateArt = null)
        {
            var embed = new DiscordEmbedBuilder();

            foreach (KeyValuePair<string, string> rule in rules)
            {
                embed.AddField(FormatSymbols(rule.Key), FormatSymbols(rule.Value));
            }

            embed.WithColor(Constants.COLORS.GetValueOrDefault(card.Type == "Villain" || card.Type == "Main Scheme" ? "Villain" : card.Classification, new DiscordColor("2337CF")));
            embed.WithTitle(card.SpoilerIfIncomplete((card.Unique ? Constants.UNIQUE_SYMBOL : "") + card.Name + (card.Subname != null ? $" — {card.Subname}" : "")));
            embed.WithUrl(card.BuildImagePath(alternateArt));
            embed.WithFooter(card.BuildFooter());

            if (!card.Incomplete)
            {
                embed.WithThumbnail(card.BuildImagePath(alternateArt));
            }

            return embed;
        }

        internal static string BuildStats(this CardEntity card)
        {
            List<string> components = new List<string>();

            bool hasEconomy = card.Cost != null || card.Resource != null || card.Boost != null;
            bool hasAbilities = card.Recover != null || card.Scheme != null || card.Thwart != null || card.Attack != null || card.Defense != null;
            bool hasFeatures = card.Hand != null || card.Health != null || card.Acceleration != null || card.Threat != null;

            if (hasEconomy)
            {
                List<string> economy = new List<string>();

                if (card.Cost != null)
                {
                    economy.Add($"Cost: {card.Cost}");
                }

                if (card.Resource != null)
                {
                    economy.Add($"Resource: {card.Resource}");
                }

                if (card.Boost != null)
                {
                    economy.Add($"Boost: {card.Boost}");
                }

                components.Add(string.Join("\n", economy));
            }

            if (hasAbilities)
            {
                List<string> abilities = new List<string>();

                if (card.Recover != null)
                {
                    abilities.Add($"REC: {card.Recover}");
                }

                if (card.Scheme != null)
                {
                    string suffix = card.Slash ? "/THW" : "";
                    abilities.Add($"SCH{suffix}: {card.Scheme}");
                }

                if (card.Thwart != null)
                {
                    string prefix = card.Slash ? "SCH/" : "";
                    abilities.Add($"{prefix}THW: {card.Thwart}");
                }

                if (card.Attack != null)
                {
                    abilities.Add($"ATK: {card.Attack}");
                }

                if (card.Defense != null)
                {
                    abilities.Add($"DEF: {card.Defense}");
                }

                components.Add(string.Join("\n", abilities));
            }

            if (hasFeatures)
            {
                List<string> features = new List<string>();

                if (card.Hand != null)
                {
                    features.Add($"Hand Size: {card.Hand}");
                }

                if (card.Health != null)
                {
                    features.Add($"Health: {card.Health}");
                }

                if (card.Threat != null)
                {
                    features.Add($"Starting Threat: {card.Threat}");
                }

                if (card.Acceleration != null)
                {
                    features.Add($"Acceleration: {card.Acceleration}");
                }

                if (card.Threshold != null)
                {
                    features.Add($"Threshold: {card.Threshold}");
                }

                components.Add(string.Join("\n", features));
            }

            return string.Join("\n\n", components);
        }

        internal static Dictionary<string, string> EvaluateRules(this CardEntity card)
        {
            if (card.Rules != null || card.Special != null)
            {
                Dictionary<string, string> rules = new Dictionary<string, string>();

                foreach (RuleEntity rule in RuleDao._rules)
                {
                    List<Match> matches = Regex.Matches(card.Rules ?? "", rule.Regex, RegexOptions.IgnoreCase).ToList();
                    matches.AddRange(Regex.Matches(card.Special ?? "", rule.Regex, RegexOptions.IgnoreCase).ToList());

                    foreach (Match match in matches.Distinct())
                    {
                        if (match.Success)
                        {
                            string name = rule.RowKey + (match.Groups.Keys.Contains("quantity") ? $" {match.Groups["quantity"].Value}" : "");
                            string description = rule.Description;

                            foreach (string replacement in new List<string>() { "quantity", "start", "type" })
                            {
                                description = Regex.Replace(description, $"{{{replacement}}}", match.Groups[replacement].Value ?? "");
                            }

                            if (!rules.Keys.ToList().Exists(x => x == name))
                            {
                                rules.Add(name, description);
                            }
                        }
                    }
                }

                return rules;
            }
            else
            {
                return null;
            }
        }

        private static string FormatSymbols(string text)
        {
            return Constants.SYMBOLS.Aggregate(text, (filter, entry) => filter.Replace(entry.Key, entry.Value));
        }

        private static string FormatText(string text, string exclusion = null)
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

        internal static List<string> GetAlternateArts(this CardEntity card)
        {
            List<string> arts = new List<string>()
            {
                card.RowKey
            };

            foreach (PrintingEntity printing in card.Printings)
            {
                if (printing.AlternateArt)
                {
                    arts.Add(printing.RowKey);
                }
            }

            return arts;
        }

        internal static string GetBaseId(this CardEntity card)
        {
            return card.RowKey.Substring(0, Constants.ID_LENGTH);
        }

        internal static List<PrintingEntity> GetReprints(this CardEntity card)
        {
            List<PrintingEntity> reprints = card.Printings.FindAll(x => x.RowKey != x.ArtificialId);

            if (reprints.Count == 0)
            {
                return null;
            }
            else
            {
                return reprints;
            }
        }

        internal static bool IsRelatedTo(this CardEntity thisCard, CardEntity thatCard)
        {
            if (thisCard.RowKey.Length > Constants.ID_LENGTH && thatCard.RowKey.Length > Constants.ID_LENGTH)
            {
                return thisCard.RowKey != thatCard.RowKey && thisCard.GetBaseId() == thatCard.GetBaseId();
            }
            else
            {
                return false;
            }
        }

        private static string QuoteText(string text)
        {
            return string.Join("\n", text.Split("\n").Select(x => $"> {x}"));
        }

        private static string SpoilerIfIncomplete(this CardEntity card, string text)
        {
            if (card.Incomplete)
            {
                return Formatter.Spoiler(text);
            }
            else
            {
                return text;
            }
        }

        internal static string Summary(this CardEntity card)
        {
            StringBuilder summary = new StringBuilder();
            
            summary.Append(Formatter.Bold(card.Name));

            if (card.Subname != null)
            {
                summary.Append($" — {card.Subname}");
            }

            summary.Append($" | {card.BuildHeader(true)}");

            if (card.Resource != null)
            {
                summary.Append($" {FormatSymbols(card.Resource)}");
            }

            return card.SpoilerIfIncomplete(summary.ToString());
        }
    }
}
