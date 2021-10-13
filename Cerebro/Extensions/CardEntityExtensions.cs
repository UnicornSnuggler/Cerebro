using Cerebro.Models;
using DSharpPlus;
using DSharpPlus.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Cerebro.Extensions
{
    internal static class CardEntityExtensions
    {
        internal static DiscordEmbed BuildEmbed(this CardEntity card)
        {
            var embed = new DiscordEmbedBuilder();

            StringBuilder description = new StringBuilder();
            description.AppendLine(card.BuildHeader());

            if (card.Traits != null)
            {
                description.AppendLine(Formatter.Italic(Formatter.Bold(card.Traits)));
            }

            description.AppendLine();

            string stats = card.BuildStats();

            if (stats.Length > 0)
            {
                description.AppendLine(FormatSymbols(stats));
                description.AppendLine();
            }

            List<string> body = new List<string>();

            if (card.Rules != null)
            {
                body.Add(FormatText(QuoteText(card.Rules), card.Name));
            }

            if (card.Special != null)
            {
                body.Add(FormatText(QuoteText(card.Special), card.Name));
            }

            if (card.Flavor != null)
            {
                body.Add(Formatter.Italic(Formatter.Sanitize(card.Flavor)));
            }

            if (body.Count > 0)
            {
                description.AppendLine(string.Join("\n\n", body));
            }

            embed.WithColor(Constants.COLORS.GetValueOrDefault(card.Type == "Villain" || card.Type == "Main Scheme" ? "Villain" : card.Classification, new DiscordColor("2337CF")));
            embed.WithTitle((card.Unique ? Constants.UNIQUE_SYMBOL : "") + card.Name + (card.Subname != null ? $" — {card.Subname}" : "" ));
            embed.WithThumbnail(card.Image);
            embed.WithDescription(description.ToString());
            embed.WithFooter(card.BuildFooter());

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

        internal static string BuildHeader(this CardEntity card)
        {
            StringBuilder header = new StringBuilder();

            if (card.Classification != "Encounter" && card.Type != "Hero" && card.Type != "Alter-Ego")
            {
                header.Append($"{card.Classification} ");
            }

            header.Append(card.Type);

            if (card.Stage != null)
            {
                header.Append($" — Stage {card.Stage}");
            }

            return Formatter.Bold(header.ToString());
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
                    abilities.Add($"SCH: {card.Scheme}");
                }

                if (card.Thwart != null)
                {
                    abilities.Add($"THW: {card.Thwart}");
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

        private static string FormatSymbols(string text)
        {
            return Constants.SYMBOLS.Aggregate(text, (filter, entry) => filter.Replace(entry.Key, entry.Value));
        }

        private static string FormatText(string text, string cardName = null)
        {
            List<string> exemptions = Constants.UNFORMATTED;
            exemptions.Add(cardName);

            for (int i = 0; i < exemptions.Count(); i++)
            {
                text = text.Replace(exemptions[i], $"[[{i}]]");
            }

            string[] lines = text.Split("\n");

            for (int i = 0; i < lines.Count(); i++)
            {
                lines[i] = Constants.BOLDS.Aggregate(lines[i], (filter, word) => filter.Replace(word, Formatter.Bold(word)));
                lines[i] = Constants.ITALICS.Aggregate(lines[i], (filter, word) => filter.Replace(word, Formatter.Italic(word)));
                lines[i] = Constants.EMPHASES.Aggregate(lines[i], (filter, word) => filter.Replace(word, Formatter.Italic(Formatter.Bold(word))));
                lines[i] = lines[i].Replace("(**", "**(");
                lines[i] = lines[i].Replace("**)", ")**");
            }

            string output = FormatSymbols(string.Join("\n", lines));

            for (int i = 0; i < exemptions.Count(); i++)
            {
                output = output.Replace($"[[{i}]]", exemptions[i]);
            }

            return output;
        }

        internal static bool IsRelatedTo(this CardEntity thisCard, CardEntity thatCard)
        {
            if (thisCard.RowKey.Length > Constants.ID_LENGTH && thatCard.RowKey.Length > Constants.ID_LENGTH)
            {
                string baseId = thatCard.RowKey.Substring(0, Constants.ID_LENGTH);

                return thisCard.RowKey != thatCard.RowKey && thisCard.RowKey.Contains(baseId);
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

        internal static string Summary(this CardEntity card)
        {
            StringBuilder summary = new StringBuilder();
            
            summary.Append(Formatter.Bold(card.Name));

            if (card.Subname != null)
            {
                summary.Append($" — {card.Subname}");
            }

            summary.Append($" | {card.BuildHeader()}");

            if (card.Resource != null)
            {
                summary.Append($" {FormatSymbols(card.Resource)}");
            }

            return summary.ToString();
        }
    }
}
