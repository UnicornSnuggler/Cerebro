using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Bounty.Attributes
{
    class RequiresAdministratorAttribute : CheckBaseAttribute
    {
        private static List<string> ADMINISTRATORS = new List<string>()
        {
            "132708937584607233"
        };

        public override Task<bool> ExecuteCheckAsync(CommandContext context, bool help)
        {
            return Task.FromResult(ADMINISTRATORS.Contains(context.Message.Author.Id.ToString()));
        }
    }
}
