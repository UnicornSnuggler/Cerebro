using DSharpPlus;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace CerebroBeta
{
    public class BotService
    {
        private readonly ILogger<DiscordClient> _logger;
        private readonly DiscordClient _discordClient;

        public BotService(ILogger<DiscordClient> logger, DiscordClient discordClient)
        {
            _logger = logger;
            _discordClient = discordClient;
        }

        public async Task Run()
        {
            await _discordClient.ConnectAsync();

            _logger.LogInformation("Initialization complete!");

            await Task.Delay(-1);
        }
    }
}