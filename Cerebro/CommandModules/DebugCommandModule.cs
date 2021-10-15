using Cerebro.Attributes;
using Cerebro.Dao;
using Cerebro.Extensions;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Cerebro.CommandModules
{
    [Group("debug")]
    [Description("Administrator debugging activities.")]
    [RequiresAdministrator]
    class DebugCommandModule : BaseCommandModule
    {
        private readonly ILogger _logger;
        private readonly ICerebroDao _cardDao;

        public DebugCommandModule(ILogger<DebugCommandModule> logger, ICerebroDao cardDao)
        {
            _logger = logger;
            _cardDao = cardDao;
        }

        [Command("update")]
        [Description("Update card database.")]
        public async Task CardCommand(CommandContext context)
        {
            _cardDao.UpdateCardList();

            await context.SendEmbed("Card database updated successfully!");
        }
    }
}