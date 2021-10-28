using Cerebro.Attributes;
using Cerebro.Extensions;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Exceptions;
using System;
using System.Threading.Tasks;

namespace Cerebro.Handlers
{
    class CommandErroredEventHandler
    {
        public async static Task EvaluateErrors(CommandsNextExtension extension, CommandErrorEventArgs e)
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
                            await e.Context.SendEmbed($"That command is only usable by administrators.");

                            return;
                        }
                    }
                }
            }
            catch { }

            Console.Error.WriteLine($"Encountered an exception:\n\n{e.Exception}");

            await e.Context.SendEmbed($"I ran into an unexpected error! {Constants.OWNER_MENTION} should check the logs to discover what went wrong...");
        }
    }
}
