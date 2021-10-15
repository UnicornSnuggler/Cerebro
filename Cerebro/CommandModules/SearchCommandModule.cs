using Cerebro.Attributes;
using Cerebro.Dao;
using Cerebro.Extensions;
using Cerebro.Models;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using DSharpPlus.Entities;
using DSharpPlus.Interactivity.Extensions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Cerebro.CommandModules
{
    [Group("search")]
    [Description("All searching functionality.")]
    class SearchCommandModule : BaseCommandModule
    {
        private readonly ILogger _logger;
        private readonly ICerebroDao _cardDao;

        public SearchCommandModule(ILogger<SearchCommandModule> logger, ICerebroDao cardDao)
        {
            _logger = logger;
            _cardDao = cardDao;
        }

        [Command("name")]
        [Description("Retrieve a card by name.")]
        public async Task CardCommand(CommandContext context, [Description("The name of the card being queried.")][RemainingText] string cardName)
        {
            List<CardEntity> results = _cardDao.RetrieveByName(cardName);

            try
            {
                if (results == null)
                {
                    await context.SendEmbed("No matching cards were found...");
                }
                else
                {
                    if (results.Count == 1)
                    {
                        var card = results[0];
                        var embed = card.BuildEmbed();
                        var message = await context.RespondAsync(embed);

                        List<string> artStyles = _cardDao.FindArtStyles(card);
                        List<CardEntity> faces = _cardDao.FindFaces(card);
                        List<CardEntity> stages = _cardDao.FindStages(card);

                        await Imbibe(context, message, card, artStyles, 0, faces, faces != null ? faces.IndexOf(card) : -1, stages, stages != null ? stages.IndexOf(card) : -1);
                    }
                    else
                    {
                        List<string> choices = new List<string>();

                        foreach (CardEntity card in results)
                        {
                            choices.Add(card.Summary());
                        }

                        int choice = await context.AwaitChoice("Multiple matches were found for your query.  Please select one of the following...", choices);

                        if (choice != -1 && choice < choices.Count)
                        {
                            var card = results[choice];
                            var embed = card.BuildEmbed();
                            var message = await context.RespondAsync(embed);

                            List<string> artStyles = _cardDao.FindArtStyles(card);
                            List<CardEntity> faces = _cardDao.FindFaces(card);
                            List<CardEntity> stages = _cardDao.FindStages(card);

                            await Imbibe(context, message, card, artStyles, 0, faces, faces != null ? faces.IndexOf(card) : -1, stages, stages != null ? stages.IndexOf(card) : -1);
                        }
                    }
                }
            }
            catch (Exception e)
            {
                _logger.LogError($"Encountered an exception:\n\n{e}");

                if (e.GetType() == typeof(DSharpPlus.Exceptions.UnauthorizedException))
                {
                    try
                    {
                        await context.SendEmbed($"{Constants.OWNER_MENTION} — I'm missing some required permissions! Contact the server administrator to rectify this issue.");
                    }
                    catch { }
                }
            }
        }

        public async Task Imbibe(CommandContext context, DiscordMessage message, CardEntity card, List<string> artStyles, int currentArtStyle, List<CardEntity> faces, int currentFace, List<CardEntity> stages, int currentStage)
        {
            var artReaction = DiscordEmoji.FromName(context.Client, Constants.ART_EMOJI);
            var flipReaction = DiscordEmoji.FromName(context.Client, Constants.REPEAT_EMOJI);
            var leftArrowReaction = DiscordEmoji.FromName(context.Client, Constants.ARROW_LEFT_EMOJI);
            var rightArrowReaction = DiscordEmoji.FromName(context.Client, Constants.ARROW_RIGHT_EMOJI);

            List<DiscordEmoji> expectedEmojis = new List<DiscordEmoji>();

            if (faces != null)
            {
                expectedEmojis.Add(flipReaction);

                await message.CreateReactionAsync(flipReaction);
            }

            if (stages != null)
            {
                expectedEmojis.Add(leftArrowReaction);
                expectedEmojis.Add(rightArrowReaction);

                await message.CreateReactionAsync(leftArrowReaction);
                await message.CreateReactionAsync(rightArrowReaction);
            }
            
            if (artStyles != null)
            {
                expectedEmojis.Add(artReaction);

                await message.CreateReactionAsync(artReaction);
            }

            var reaction = await message.WaitForReactionAsync(context.Message.Author);

            while (!reaction.TimedOut)
            {
                if (expectedEmojis.Contains(reaction.Result.Emoji))
                {
                    DiscordMessage nextMessage;
                    CardEntity nextCard = card;
                    int nextArtStyle = currentArtStyle;
                    List<string> nextArtStyles = artStyles;
                    int nextFace = currentFace;
                    List<CardEntity> nextFaces = faces;
                    int nextStage = currentStage;
                    List<CardEntity> nextStages = stages;

                    if (reaction.Result.Emoji == artReaction)
                    {
                        nextArtStyle = currentArtStyle + 1 < artStyles.Count ? currentArtStyle + 1 : 0;
                        var nextChoice = artStyles[nextArtStyle];

                        await message.DeleteAllReactionsAsync();

                        var embed = card.BuildEmbed(nextChoice);
                        nextMessage = await message.ModifyAsync(embed);
                    }
                    else if (reaction.Result.Emoji == flipReaction)
                    {
                        nextFace = currentFace + 1 < faces.Count ? currentFace + 1 : 0;
                        nextCard = faces[nextFace];

                        await message.DeleteAllReactionsAsync();

                        var embed = nextCard.BuildEmbed();
                        nextMessage = await message.ModifyAsync(embed);

                        nextArtStyles = _cardDao.FindArtStyles(nextCard);
                        nextArtStyle = 0;

                        nextStages = _cardDao.FindStages(nextCard);
                        nextStage = nextStages != null ? nextStages.IndexOf(nextCard) : -1;
                    }
                    else if (reaction.Result.Emoji == leftArrowReaction)
                    {
                        nextStage = currentStage - 1 >= 0 ? currentStage - 1 : stages.Count - 1;
                        nextCard = stages[nextStage];

                        await message.DeleteAllReactionsAsync();

                        var embed = nextCard.BuildEmbed();
                        nextMessage = await message.ModifyAsync(embed);

                        nextArtStyles = _cardDao.FindArtStyles(nextCard);
                        nextArtStyle = 0;

                        nextFaces = _cardDao.FindFaces(nextCard);
                        nextFace = nextFaces != null ? nextFaces.IndexOf(nextCard) : -1;
                    }
                    else if (reaction.Result.Emoji == rightArrowReaction)
                    {
                        nextStage = currentStage + 1 < stages.Count ? currentStage + 1 : 0;
                        nextCard = stages[nextStage];

                        await message.DeleteAllReactionsAsync();

                        var embed = nextCard.BuildEmbed();
                        nextMessage = await message.ModifyAsync(embed);

                        nextArtStyles = _cardDao.FindArtStyles(nextCard);
                        nextArtStyle = 0;

                        nextFaces = _cardDao.FindFaces(nextCard);
                        nextFace = nextFaces != null ? nextFaces.IndexOf(nextCard) : -1;
                    }
                    else
                    {
                        break;
                    }

                    await Imbibe(context, nextMessage, nextCard, nextArtStyles, nextArtStyle, nextFaces, nextFace, nextStages, nextStage);

                    break;
                }
                else
                {
                    break;
                }
            }

            await message.DeleteAllReactionsAsync();
        }
    }
}