﻿using Cerebro.Utilities;
using Cerebro_Utilities.Models;
using DSharpPlus;
using DSharpPlus.Entities;
using System.Collections.Generic;

namespace Cerebro.Extensions
{
    internal static class RuleEntityExtensions
    {
        internal static DiscordEmbed BuildEmbed(this RuleEntity rule)
        {
            var embed = new DiscordEmbedBuilder();

            string imagePath = StringHelper.BuildImagePath(Constants.RULES_IMAGE_PREFIX, rule.RowKey);

            embed.WithColor(Constants.COLORS.GetValueOrDefault("Basic", new DiscordColor("2337CF")));
            embed.WithTitle(StringHelper.FormatSymbols(rule.Title));
            embed.WithUrl(imagePath);

            if (rule.Reference != null)
            {
                embed.WithDescription(StringHelper.FormatText(rule.Reference));
                embed.WithThumbnail(imagePath);
            }
            else
            {
                embed.WithImageUrl(imagePath);
            }

            if (rule.Footer != null)
            {
                embed.WithFooter(rule.Footer);
            }

            return embed;
        }

        internal static string Summary(this RuleEntity rule)
        {
            return StringHelper.FormatSymbols(Formatter.Bold(rule.Title));
        }
    }
}
