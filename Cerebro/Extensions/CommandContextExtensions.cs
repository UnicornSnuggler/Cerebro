using Cerebro.Models;
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

        public static async Task<int> AwaitChoice(this CommandContext context, string message, List<string> choices)
        {
            List<DiscordEmoji> emojis = new List<DiscordEmoji>();

            StringBuilder contents = new StringBuilder(message);
            contents.AppendLine();

            for (int i = 0; i < choices.Count; i++)
            {
                emojis.Add(DiscordEmoji.FromName(context.Client, CHOICE_EMOJIS[i]));
                contents.AppendLine($"{emojis[i]}: {choices[i]}");
            }

            var embed = await context.RespondAsync(CreateEmbed(context, contents.ToString()));

            for (int i = 0; i < choices.Count; i++)
            {
                await embed.CreateReactionAsync(emojis[i]);
            }

            var reaction = await embed.WaitForReactionAsync(context.Message.Author, TimeSpan.FromSeconds(Constants.TIMEOUT));

            // TODO: Have this modify the message to display a timeout error rather than just poofing.

            await embed.DeleteAsync();

            if (reaction.TimedOut)
            {
                return -1;
            }
            else
            {
                return emojis.FindIndex(x => x.Equals(reaction.Result.Emoji));
            }
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

            var message = new DiscordMessageBuilder()
                .WithEmbed(embed)
                .WithReply(context.Message.Id, true);

            return message;
        }

        public static async void MakeFlippable(this CommandContext context, DiscordMessage message, List<CardEntity> choices, CardEntity current)
        {
            var flipReaction = DiscordEmoji.FromName(context.Client, Constants.REPEAT_EMOJI);

            await message.CreateReactionAsync(flipReaction);

            var reaction = await message.WaitForReactionAsync(context.Message.Author);

            if (!reaction.TimedOut)
            {
                if (reaction.Result.Emoji == flipReaction)
                {
                    var nextChoice = choices[0];

                    choices.RemoveAt(0);
                    choices.Add(current);

                    var embed = nextChoice.BuildEmbed();

                    await message.DeleteAllReactionsAsync();

                    var newMessage = await message.ModifyAsync(embed);

                    context.MakeFlippable(newMessage, choices, nextChoice);
                }
            }
            else
            {
                await message.DeleteAllReactionsAsync();
            }
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