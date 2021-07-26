using Bounty.Dao;
using Bounty.Extensions;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Bounty.CommandModules
{
    [Group("profile")]
    [Description("Self-management of save data.")]
    class ProfileCommandModule : BaseCommandModule
    {
        private readonly ILogger _logger;
        private readonly IGenericDao _genericDao;

        public ProfileCommandModule(ILogger<DebugCommandModule> logger, IGenericDao genericDao)
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

            public TestCommands(ProfileCommandModule profileCommandModule)
            {
                _logger = profileCommandModule._logger;
                _genericDao = profileCommandModule._genericDao;
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
