using DSharpPlus.CommandsNext;
using DSharpPlus.Entities;
using DSharpPlus.Interactivity.Extensions;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Bounty.Extensions
{
    public static class CommandContextExtensions
    {
        private static DiscordColor DEFAULT_COLOR = DiscordColor.Azure;

        public enum CONFIRMATION_CODE
        {
            Accept,
            Decline,
            Timeout
        }

        public static async Task<CONFIRMATION_CODE> AwaitConfirmationAsync(this CommandContext context, string confirmation)
        {
            var affirmativeEmoji = DiscordEmoji.FromName(context.Client, Constants.AFFIRMATIVE_EMOJI);
            var negativeEmoji = DiscordEmoji.FromName(context.Client, Constants.NEGATIVE_EMOJI);

            var message = await context.RespondAsync(CreateEmbed(context, confirmation));

            await message.CreateReactionAsync(affirmativeEmoji);
            await message.CreateReactionAsync(negativeEmoji);

            var reaction = await message.WaitForReactionAsync(context.Message.Author, TimeSpan.FromSeconds(Constants.TIMEOUT));

            if (reaction.TimedOut)
            {
                return CONFIRMATION_CODE.Timeout;
            }
            else
            {
                if (reaction.Result.Emoji == affirmativeEmoji)
                {
                    return CONFIRMATION_CODE.Accept;
                }
                else
                {
                    return CONFIRMATION_CODE.Decline;
                }
            }
        }

        public static DiscordMessageBuilder CreateEmbed(this CommandContext context, string content)
        {
            return CreateEmbed(context, DEFAULT_COLOR, null, content, null);
        }

        public static DiscordMessageBuilder CreateEmbed(this CommandContext context, DiscordColor color, string title, string content, List<KeyValuePair<string, string>> fields)
        {
            var embed = new DiscordEmbedBuilder()
            {
                Color = color,
                Description = content,
                Timestamp = DateTime.UtcNow
            };

            embed.WithFooter(context.Message.Author.Username, context.Message.Author.AvatarUrl);

            if (title != null)
            {
                embed.Title = title;
            }

            if (fields != null)
            {
                fields.ForEach(field =>
                {
                    embed.AddField(field.Key, field.Value);
                });
            }

            var message = new DiscordMessageBuilder()
                .WithEmbed(embed)
                .WithReply(context.Message.Id, true);

            return message;
        }

        public static async Task SendEmbed(this CommandContext context, string content)
        {
            await SendEmbed(context, DEFAULT_COLOR, null, content, null);
        }

        public static async Task SendEmbed(this CommandContext context, DiscordColor color, string title, string content, List<KeyValuePair<string, string>> fields)
        {
            var message = CreateEmbed(context, color, title, content, fields);

            await context.RespondAsync(message);
        }
    }
}