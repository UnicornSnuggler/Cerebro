using Bounty.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Bounty
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var services = new ServiceCollection();
            services.ConfigureServices();

            var logger = services
                .BuildServiceProvider()
                .GetRequiredService<ILogger<Program>>();

            logger.LogInformation("Initializing program...");

            try
            {
                logger.LogInformation("Connecting to the Discord server...");

                var client = services
                    .BuildServiceProvider()
                    .GetRequiredService<BotService>();

                logger.LogInformation("Discord client was successfully created.");

                await client.Run();
            }
            catch (Exception error)
            {
                logger.LogError(error, "An error occurred while connecting to the Discord server!  Shutting down...");
            }
        }
    }
}
