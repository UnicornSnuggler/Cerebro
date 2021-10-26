using DSharpPlus;
using DSharpPlus.CommandsNext;
using DSharpPlus.Entities;
using DSharpPlus.EventArgs;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Cerebro.Handlers
{
    class MessageCreatedEventHandler
    {
        public async static Task HelpFormatterOnBlankMessage(DiscordClient client, MessageCreateEventArgs e)
        {
            var message = e.Message.Content.ToLower().Trim();

            if (message.Equals(Constants.COMMAND_PREFIX.Trim()) || message.Equals(Constants.BOT_MENTION.Trim()))
            {
                var extension = client.GetCommandsNext();

                var command = extension.FindCommand("help", out var args);

                var context = extension.CreateContext(e.Message, message, command, args);

                await extension.ExecuteCommandAsync(context);
            }
        }

        public async static Task EvaluateQueries(DiscordClient client, MessageCreateEventArgs e)
        {
            if (e.Author.IsBot)
            {
                return;
            }

            if (e.Guild == null)
            {
                var embed = new DiscordEmbedBuilder()
                {
                    Color = DiscordColor.Azure,
                    Description = "Oops!  At this time, queries cannot be made from DMs due to functional restrictions, but this feature will be added soon!"
                };

                await client.SendMessageAsync(e.Channel, embed);
            }
            else
            {
                var message = e.Message.Content;

                Regex cardRegex = new Regex(@"\{\{[^\{\}]+\}\}", RegexOptions.Compiled);

                MatchCollection cardMatches = cardRegex.Matches(message);

                if (cardMatches.Count != 0)
                {
                    foreach (var match in cardMatches)
                    {
                        var cleanedName = match.ToString().Replace("{{", "").Replace("}}", "");

                        var extension = client.GetCommandsNext();

                        var command = extension.FindCommand("search name", out var args);

                        var context = extension.CreateContext(e.Message, Constants.COMMAND_PREFIX, command, cleanedName);

                        _ = Task.Run(() => extension.ExecuteCommandAsync(context));
                    }
                }

                Regex ruleRegex = new Regex(@"\(\([^\(\)]+\)\)", RegexOptions.Compiled);

                MatchCollection ruleMatches = ruleRegex.Matches(message);

                if (ruleMatches.Count != 0)
                {
                    foreach (var match in ruleMatches)
                    {
                        var cleanedTerm = match.ToString().Replace("((", "").Replace("))", "");

                        var extension = client.GetCommandsNext();

                        var command = extension.FindCommand("search rule", out var args);

                        var context = extension.CreateContext(e.Message, Constants.COMMAND_PREFIX, command, cleanedTerm);

                        _ = Task.Run(() => extension.ExecuteCommandAsync(context));
                    }
                }
            }
        }
    }
}
