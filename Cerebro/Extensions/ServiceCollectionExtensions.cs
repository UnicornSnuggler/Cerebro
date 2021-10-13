using Cerebro.CommandModules;
using Cerebro.Dao;
using Cerebro.Handlers;
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
                .AddSingleton<DebugCommandModule>()
                .AddSingleton<SearchCommandModule>();

            var client = new DiscordClient(new DiscordConfiguration
            {
                MinimumLogLevel = LogLevel.Information,
                Token = configuration.GetValue<string>(Constants.CONFIG_TOKEN),
                TokenType = TokenType.Bot
            });

            client.MessageCreated += MessageCreatedEventHandler.HelpFormatterOnBlankMessage;
            client.MessageCreated += MessageCreatedEventHandler.FindCardNames;

            var commands = client.UseCommandsNext(new CommandsNextConfiguration
            {
                Services = services.BuildServiceProvider(),
                EnableDefaultHelp = true,
                EnableDms = true,
                EnableMentionPrefix = true,
                StringPrefixes = new[] { Constants.COMMAND_PREFIX }
            });

            commands.SetHelpFormatter<DefaultHelpFormatter>();
            commands.RegisterCommands<DebugCommandModule>();
            commands.RegisterCommands<SearchCommandModule>();

            commands.CommandErrored += CommandErroredEventHandler.TriggerDefaultHelpFormatter;

            client.UseInteractivity();

            services
                .AddSingleton(client)
                .AddSingleton<BotService>();

            return services;
        }
    }
}