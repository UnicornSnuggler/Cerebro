using Cerebro.Attributes;
using Cerebro_Utilities.Dao;
using Cerebro.Extensions;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using System.Threading.Tasks;

namespace Cerebro.CommandModules
{
    [Group("update")]
    [Description("Administrator update utilities.")]
    [RequiresAdministrator]
    class DebugCommandModule : BaseCommandModule
    {
        private readonly IFormattingDao _formattingDao;
        private readonly IPackDao _packDao;
        private readonly IRuleDao _ruleDao;
        private readonly ISetDao _setDao;

        public DebugCommandModule(IFormattingDao formattingDao, IPackDao packDao, IRuleDao ruleDao, ISetDao setDao)
        {
            _formattingDao = formattingDao;
            _packDao = packDao;
            _ruleDao = ruleDao;
            _setDao = setDao;
        }

        [Command("formattings")]
        [Description("Update the formattings list.")]
        public async Task FormattingsCommand(CommandContext context)
        {
            _formattingDao.RetrieveAllFormattings();

            await context.SendEmbed($"Successfully imported {FormattingDao._formattings.Count} formattings from the database!");
        }

        [Command("packs")]
        [Description("Update the packs list.")]
        public async Task PacksCommand(CommandContext context)
        {
            _packDao.RetrieveAllPacks();

            await context.SendEmbed($"Successfully imported {PackDao._packs.Count} packs from the database!");
        }

        [Command("rules")]
        [Description("Update the rules list.")]
        public async Task RulesCommand(CommandContext context)
        {
            _ruleDao.RetrieveAllRules();

            await context.SendEmbed($"Successfully imported {RuleDao._rules.Count} rules from the database!");
        }

        [Command("sets")]
        [Description("Update the sets list.")]
        public async Task SetsCommand(CommandContext context)
        {
            _setDao.RetrieveAllSets();

            await context.SendEmbed($"Successfully imported {SetDao._sets.Count} sets from the database!");
        }
    }
}