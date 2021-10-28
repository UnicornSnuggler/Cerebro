using DSharpPlus.CommandsNext;
using DSharpPlus.Entities;
using DSharpPlus.Interactivity.Extensions;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Cerebro.Extensions
{
    public static class CommandContextExtensions
    {
        private static DiscordColor DEFAULT_COLOR = DiscordColor.Azure;

        private static List<string> CHOICE_EMOJIS = new List<string>()
        {
            Constants.ONE_EMOJI,
            Constants.TWO_EMOJI,
            Constants.THREE_EMOJI,
            Constants.FOUR_EMOJI,
            Constants.FIVE_EMOJI,
            Constants.SIX_EMOJI,
            Constants.SEVEN_EMOJI,
            Constants.EIGHT_EMOJI,
            Constants.NINE_EMOJI
        };

        public enum CONFIRMATION_CODE
        {
            Accept,
            Decline,
            Timeout
        }

        public static async Task<CONFIRMATION_CODE> AwaitConfirmation(this CommandContext context, string confirmation)
        {
            var affirmativeEmoji = DiscordEmoji.FromName(context.Client, Constants.AFFIRMATIVE_EMOJI);
            var negativeEmoji = DiscordEmoji.FromName(context.Client, Constants.NEGATIVE_EMOJI);

            var message = await context.RespondAsync(CreateMessage(context, confirmation));

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

        public static async Task<DiscordEmoji> AwaitChoice(this CommandContext context, DiscordMessage message, List<DiscordEmoji> emojis)
        {
            foreach (DiscordEmoji emoji in emojis)
            {
                await message.CreateReactionAsync(emoji);
            }

            var reaction = await message.WaitForReactionAsync(context.Message.Author, TimeSpan.FromSeconds(Constants.TIMEOUT));

            if (reaction.TimedOut)
            {
                return null;
            }
            else
            {
                return reaction.Result.Emoji;
            }
        }

        public static DiscordMessageBuilder CreateChoiceMessage(this CommandContext context, string content, List<DiscordEmoji> emojis, List<string> choices)
        {
            StringBuilder contents = new StringBuilder();
            contents.AppendLine(content);

            for (int i = 0; i < choices.Count; i++)
            {
                contents.AppendLine($"{emojis[i]} {choices[i]}");
            }

            return CreateMessage(context, DEFAULT_COLOR, null, contents.ToString(), null);
        }

        public static DiscordEmbed CreateEmbed(this CommandContext context, string content)
        {
            return CreateEmbed(context, DEFAULT_COLOR, null, content, null);
        }

        public static DiscordEmbed CreateEmbed(this CommandContext context, DiscordColor color, string title, string content, List<KeyValuePair<string, string>> fields)
        {
            var embed = new DiscordEmbedBuilder()
            {
                Color = color,
                Description = content
            };

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

            return embed;
        }

        public static DiscordMessageBuilder CreateMessage(this CommandContext context, string content)
        {
            return CreateMessage(context, DEFAULT_COLOR, null, content, null);
        }

        public static DiscordMessageBuilder CreateMessage(this CommandContext context, DiscordColor color, string title, string content, List<KeyValuePair<string, string>> fields)
        {
            var embed = context.CreateEmbed(color, title, content, fields);

            var message = new DiscordMessageBuilder()
                .WithEmbed(embed)
                .WithReply(context.Message.Id, true);

            return message;
        }

        public static List<DiscordEmoji> GetChoiceEmojis(this CommandContext context, int choices)
        {
            List<DiscordEmoji> emojis = new List<DiscordEmoji>();

            for (int i = 0; i < choices; i++)
            {
                emojis.Add(DiscordEmoji.FromName(context.Client, CHOICE_EMOJIS[i]));
            }

            return emojis;
        }

        public static async Task SendEmbed(this CommandContext context, string content)
        {
            await SendEmbed(context, DEFAULT_COLOR, null, content, null);
        }

        public static async Task SendEmbed(this CommandContext context, DiscordColor color, string title, string content, List<KeyValuePair<string, string>> fields)
        {
            var message = CreateMessage(context, color, title, content, fields);

            await context.RespondAsync(message);
        }
    }
}