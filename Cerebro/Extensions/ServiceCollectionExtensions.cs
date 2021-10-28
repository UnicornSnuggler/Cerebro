using Cerebro.CommandModules;
using Cerebro.Handlers;
using Cerebro.HelpFormatters;
using Cerebro_Utilities.Dao;
using DSharpPlus;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Converters;
using DSharpPlus.Interactivity.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Cerebro.Extensions
{
    internal static class ServiceCollectionExtensions
    {
        internal static IServiceCollection ConfigureServices(this IServiceCollection services)
        {
            var configuration = new ConfigurationBuilder()
                .AddEnvironmentVariables()
                .Build();

            services
                .AddLogging(log =>
                {
                    log.SetMinimumLevel(LogLevel.Information);
                    log.AddConsole();
                })
                .AddSingleton(configuration)
                .AddSingleton<ICardDao, CardDao>()
                .AddSingleton<IFormattingDao, FormattingDao>()
                .AddSingleton<IPackDao, PackDao>()
                .AddSingleton<IPrintingDao, PrintingDao>()
                .AddSingleton<IRuleDao, RuleDao>()
                .AddSingleton<ISetDao, SetDao>()
                .AddSingleton<UpdateCommandModule>()
                .AddSingleton<SearchCommandModule>();

            var client = new DiscordClient(new DiscordConfiguration
            {
                MinimumLogLevel = LogLevel.Information,
                Token = configuration.GetValue<string>(Constants.CONFIG_TOKEN),
                TokenType = TokenType.Bot
            });

            client.MessageCreated += MessageCreatedEventHandler.HelpFormatterOnBlankMessage;
            client.MessageCreated += MessageCreatedEventHandler.EvaluateQueries;

            var commands = client.UseCommandsNext(new CommandsNextConfiguration
            {
                Services = services.BuildServiceProvider(),
                EnableDefaultHelp = true,
                EnableDms = true,
                EnableMentionPrefix = true,
                StringPrefixes = new[] { Constants.COMMAND_PREFIX }
            });

            commands.SetHelpFormatter<DefaultHelpFormatter>();
            commands.RegisterCommands<UpdateCommandModule>();
            commands.RegisterCommands<SearchCommandModule>();

            commands.CommandErrored += CommandErroredEventHandler.EvaluateErrors;
            commands.SetHelpFormatter<RichHelpFormatter>();

            client.UseInteractivity();

            services
                .AddSingleton(client)
                .AddSingleton<BotService>();

            return services;
        }
    }
}