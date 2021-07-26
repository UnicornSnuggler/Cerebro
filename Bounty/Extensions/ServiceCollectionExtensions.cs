using Bounty.CommandModules;
using Bounty.Dao;
using Bounty.Handlers;
using DSharpPlus;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Converters;
using DSharpPlus.Interactivity.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Bounty.Extensions
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
                .AddSingleton<IGenericDao, GenericDao>()
                .AddSingleton<DebugCommandModule>()
                .AddSingleton<ProfileCommandModule>();

            var client = new DiscordClient(new DiscordConfiguration
            {
                MinimumLogLevel = LogLevel.Information,
                Token = configuration.GetValue<string>(Constants.CONFIG_TOKEN),
                TokenType = TokenType.Bot
            });

            client.MessageCreated += MessageCreatedEventHandler.HelpFormatterOnBlankMessage;

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
            commands.RegisterCommands<ProfileCommandModule>();

            commands.CommandErrored += CommandErroredEventHandler.TriggerDefaultHelpFormatter;

            client.UseInteractivity();

            services
                .AddSingleton(client)
                .AddSingleton<BotService>();

            return services;
        }
    }
}