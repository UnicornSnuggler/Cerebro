﻿using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Converters;
using DSharpPlus.CommandsNext.Entities;
using DSharpPlus.Entities;

namespace Cerebro.HelpFormatters
{
    public class RichHelpFormatter : DefaultHelpFormatter
    {
        public RichHelpFormatter(CommandContext ctx) : base(ctx) { }

        public override CommandHelpMessage Build()
        {
            DiscordEmbedBuilder builder = new DiscordEmbedBuilder();

            builder.WithTitle("Help");
            builder.WithColor(Constants.DEFAULT_COLOR);

            builder.AddField("Overview", "Cerebro is a bot designed to facilitate the process of looking up and discussing cards and rules pertaining to the Marvel Champions living card game.");
            
            builder.AddField("Queries", "Cerebro operates by evaluating all messages sent within channels to which it belongs for viable query syntax. " +
                "Each query type and its associated syntax is broken down below. " +
                "Multiple queries can be made in a single message and each will be evaluated in isolation. " +
                "*For example, the card `Strength` and the Rules Reference entry `Player` will both be returned with the query `{{Strength}}((Player))`.*");

            builder.AddField("Official Cards", "Any cards printed by Fantasy Flight Games in official Marvel Champions products are considered \"official cards\". " +
                "Queries for official cards are made by wrapping the name of the card being queried in two sets of curly braces — `{{like this}}`. " +
                "*For example, the card `Energy` will be returned with the query `{{Energy}}`.*");

            builder.AddField("Rules Reference", "Marvel Champions' Rules Reference is a comprehensive guide that provides in-depth rules and guidelines for all facets of the game. " +
                "Cerebro is also equipped to handle queries made for entries in the Rules Reference. " +
                "This can be done by wrapping the name of the entry being queried in two sets of parentheses — `((like this))`. " +
                "*For example, the Rules Reference entry `Villain` will be returned with the query `((Villain))`.*");

            builder.AddField("Result Precedence", "By default, Cerebro's querying logic is designed to take up to three passes through the database for a given query:\n" +
                "1. The first seeks **precise** matches by finding any row in the database whose searchable values **exactly match** all of the queried terms. " +
                "The order and captilization of the terms does not matter so long as all terms are found. " +
                "*For example, `{{Avalanche!}}` will return only the side scheme named `Avalanche!` and not the minion named `Avalanche`.*\n" +
                "2. The second seeks **similar** matches by finding any row in the database whose searchable values **partially contain** all of the queried terms. " +
                "*For example, `{{clap}}` will return the card `Thunderclap`.*\n" +
                "3. The third seeks **fuzzy** matches by finding any row in the database whose searchable values **relate to** all of the queried terms. " +
                "*For example, `{{Aunt Mag}}` will return the card `Aunt May`.*");

            builder.AddField("Wildcards", "Users can forcibly circumvent the first pass by incorporating a wildcard symbol — or asterisk(`*`) — anywhere in their term. " +
                "In this way, the query `{{Spider*}}` will return any card with the word `Spider` in its name.");

            return new CommandHelpMessage(embed: builder.Build());
        }
    }
}
