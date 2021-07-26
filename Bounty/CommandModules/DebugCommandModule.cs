using Bounty.Attributes;
using Bounty.Dao;
using Bounty.Extensions;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Bounty.CommandModules
{
    [Group("debug")]
    [Description("Administrator debugging activities.")]
    [RequiresAdministrator]
    class DebugCommandModule : BaseCommandModule
    {
        private readonly ILogger _logger;
        private readonly IGenericDao _genericDao;

        public DebugCommandModule(ILogger<DebugCommandModule> logger, IGenericDao genericDao)
        {
            _logger = logger;
            _genericDao = genericDao;
        }

        [Group("test")]
        [Description("Test commands for development.")]
        public class TestCommands : BaseCommandModule
        {
            private readonly ILogger _logger;
            private readonly IGenericDao _genericDao;

            public TestCommands(DebugCommandModule debugCommandModule)
            {
                _logger = debugCommandModule._logger;
                _genericDao = debugCommandModule._genericDao;
            }

            [Command("embed")]
            [Description("Test embed creation functionality.")]
            public async Task EmbedCommand(CommandContext context)
            {
                await context.SendEmbed("This is a sample embed that was created using DSharpPlus' `DiscordEmbedBuilder`!");
            }
        }
    }
}
