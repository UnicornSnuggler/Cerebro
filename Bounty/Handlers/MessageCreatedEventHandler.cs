using DSharpPlus;
using DSharpPlus.CommandsNext;
using DSharpPlus.EventArgs;
using System.Threading.Tasks;

namespace Bounty.Handlers
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
    }
}
