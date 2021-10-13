using Cerebro.Attributes;
using Cerebro.Dao;
using Cerebro.Extensions;
using Cerebro.Models;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cerebro.CommandModules
{
    [Group("debug")]
    [Description("Administrator debugging activities.")]
    [RequiresAdministrator]
    class DebugCommandModule : BaseCommandModule
    {
        private readonly ILogger _logger;
        private readonly ICardDao _cardDao;

        public DebugCommandModule(ILogger<DebugCommandModule> logger, ICardDao cardDao)
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

        [Command("quotes")]
        [Description("Fix all quotes to stop being compliant with Logan's control-freakiness.")]
        public async Task QuotesCommand(CommandContext context)
        {
            await _cardDao.FixQuotes();

            await context.SendEmbed("Quotes fixed successfully!");
        }
    }
}