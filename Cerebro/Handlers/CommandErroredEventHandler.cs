using Cerebro.Attributes;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Exceptions;
using System.Threading.Tasks;

namespace Cerebro.Handlers
{
    class CommandErroredEventHandler
    {
        public async static Task TriggerDefaultHelpFormatter(CommandsNextExtension extension, CommandErrorEventArgs e)
        {
            try
            {
                var failedChecks = ((ChecksFailedException)e.Exception).FailedChecks;

                if (failedChecks.Count > 0)
                {
                    foreach (var failedCheck in failedChecks)
                    {
                        if (failedCheck is RequiresAdministratorAttribute)
                        {
                            await e.Context.RespondAsync($"That command is only usable by administrators.");

                            return;
                        }
                    }
                }
            }
            catch { }

            var message = e.Context.Message;

            var invocation = message.Content.Substring(e.Context.Prefix.Length);

            var originalCommand = extension.FindCommand(invocation, out _);

            var helpString = originalCommand != null ? $"help {originalCommand.QualifiedName}" : "help";

            var command = extension.FindCommand(helpString, out var args);

            var context = extension.CreateContext(message, e.Context.Prefix, command, args);

            await extension.ExecuteCommandAsync(context);
        }
    }
}
