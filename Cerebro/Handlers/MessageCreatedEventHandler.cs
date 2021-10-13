using DSharpPlus;
using DSharpPlus.CommandsNext;
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

        public async static Task FindCardNames(DiscordClient client, MessageCreateEventArgs e)
        {
            var message = e.Message.Content;

            Regex regex = new Regex(@"\{\{(.*?)\}\}", RegexOptions.Compiled);

            MatchCollection matches = regex.Matches(message);

            if (matches.Count != 0)
            {
                foreach (var match in matches)
                {
                    var cleanedName = match.ToString().Replace("{{", "").Replace("}}", "");

                    var extension = client.GetCommandsNext();

                    var command = extension.FindCommand("search name", out var args);

                    var context = extension.CreateContext(e.Message, Constants.COMMAND_PREFIX, command, cleanedName);

                    _ = Task.Run(() => extension.ExecuteCommandAsync(context));
                }
            }
        }
    }
}
