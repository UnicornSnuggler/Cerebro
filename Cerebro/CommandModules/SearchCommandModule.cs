using Cerebro_Utilities.Dao;
using Cerebro.Extensions;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
using DSharpPlus.Entities;
using DSharpPlus.Interactivity.Extensions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cerebro_Utilities.Models;

namespace Cerebro.CommandModules
{
    [Group("search")]
    [Description("All searching functionality.")]
    class SearchCommandModule : BaseCommandModule
    {
        private readonly ILogger _logger;
        private readonly ICardDao _cardDao;
        private readonly IRuleDao _ruleDao;

        public SearchCommandModule(ILogger<SearchCommandModule> logger, ICardDao cardDao, IRuleDao ruleDao)
        {
            _logger = logger;
            _cardDao = cardDao;
            _ruleDao = ruleDao;
        }

        [Command("name")]
        [Description("Retrieve a card by name.")]
        public async Task CardCommand(CommandContext context, [Description("The name of the card being queried.")][RemainingText] string cardName)
        {
            List<CardEntity> results = _cardDao.RetrieveByName(cardName);

            try
            {
                if (results == null || results.Count == 0)
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

                        List<string> artStyles = card.GetAlternateArts();
                        List<CardEntity> faces = _cardDao.FindFaces(card.RowKey);
                        Dictionary<string, string> rules = card.EvaluateRules();
                        List<CardEntity> stages = _cardDao.FindGroup(card.Group);

                        await Imbibe(context, message, card, artStyles, 0, faces, faces != null ? faces.FindIndex(x => x.RowKey == card.RowKey) : -1, stages, stages != null ? stages.FindIndex(x => x.RowKey == card.RowKey) : -1, rules, false);
                    }
                    else
                    {
                        List<string> choices = new List<string>();

                        foreach (CardEntity card in results)
                        {
                            choices.Add(card.Summary());
                        }

                        var emojis = context.GetChoiceEmojis(choices.Count > 9 ? 9 : choices.Count);
                        var message = await context.RespondAsync(context.CreateChoiceMessage($"{choices.Count} matches were found for your query.{(choices.Count > 9 ? " Showing the top 9 results." : "")} Please select one of the following...", emojis, choices.Count > 9 ? choices.GetRange(0, 9) : choices));
                        DiscordEmoji choice = await context.AwaitChoice(message, emojis);

                        await message.DeleteAllReactionsAsync();

                        if (choice == null)
                        {
                            await message.ModifyAsync(context.CreateEmbed("The response timeout was reached..."));
                        }
                        else if (emojis.IndexOf(choice) == -1)
                        {
                            await message.ModifyAsync(context.CreateEmbed($"Your response {choice} did not equate to a valid option..."));
                        }
                        else
                        {
                            var index = emojis.IndexOf(choice);
                            var card = results[index];
                            var embed = card.BuildEmbed();
                            message = await message.ModifyAsync(embed);

                            List<string> artStyles = card.GetAlternateArts();
                            List<CardEntity> faces = _cardDao.FindFaces(card.RowKey);
                            Dictionary<string, string> rules = card.EvaluateRules();
                            List<CardEntity> stages = _cardDao.FindGroup(card.Group);

                            await Imbibe(context, message, card, artStyles, 0, faces, faces != null ? faces.FindIndex(x => x.RowKey == card.RowKey) : -1, stages, stages != null ? stages.FindIndex(x => x.RowKey == card.RowKey) : -1, rules, false);
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

        [Command("rule")]
        [Description("Retrieve a rule by term.")]
        public async Task RuleCommand(CommandContext context, [Description("A term associated with the rule being queried.")][RemainingText] string ruleTerm)
        {
            List<RuleEntity> results = _ruleDao.RetrieveByTerm(ruleTerm);

            try
            {
                if (results == null || results.Count == 0)
                {
                    await context.SendEmbed("No matching rules were found...");
                }
                else
                {
                    if (results.Count == 1)
                    {
                        var rule = results[0];
                        var embed = rule.BuildEmbed();
                        await context.RespondAsync(embed);
                    }
                    else
                    {
                        List<string> choices = new List<string>();

                        foreach (RuleEntity rule in results)
                        {
                            choices.Add(rule.Summary());
                        }

                        var emojis = context.GetChoiceEmojis(choices.Count > 9 ? 9 : choices.Count);
                        var message = await context.RespondAsync(context.CreateChoiceMessage($"{choices.Count} matches were found for your query.{(choices.Count > 9 ? " Showing the top 9 results." : "")} Please select one of the following...", emojis, choices.Count > 9 ? choices.GetRange(0, 9) : choices));
                        DiscordEmoji choice = await context.AwaitChoice(message, emojis);

                        await message.DeleteAllReactionsAsync();

                        if (choice == null)
                        {
                            await message.ModifyAsync(context.CreateEmbed("The response timeout was reached..."));
                        }
                        else if (emojis.IndexOf(choice) == -1)
                        {
                            await message.ModifyAsync(context.CreateEmbed($"Your response {choice} did not equate to a valid option..."));
                        }
                        else
                        {
                            var index = emojis.IndexOf(choice);
                            var rule = results[index];
                            var embed = rule.BuildEmbed();
                            await message.ModifyAsync(embed);
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

        public async Task Imbibe(CommandContext context, DiscordMessage message, CardEntity card, List<string> artStyles, int currentArtStyle, List<CardEntity> faces, int currentFace, List<CardEntity> stages, int currentStage, Dictionary<string, string> rules, bool rulesToggle)
        {
            var pageReaction = DiscordEmoji.FromName(context.Client, Constants.PAGE_EMOJI);
            var flipReaction = DiscordEmoji.FromName(context.Client, Constants.REPEAT_EMOJI);
            var leftArrowReaction = DiscordEmoji.FromName(context.Client, Constants.ARROW_LEFT_EMOJI);
            var rightArrowReaction = DiscordEmoji.FromName(context.Client, Constants.ARROW_RIGHT_EMOJI);
            var artReaction = DiscordEmoji.FromName(context.Client, Constants.ART_EMOJI);

            List<DiscordEmoji> expectedEmojis = new List<DiscordEmoji>();

            if (rules != null && rules.Count > 0)
            {
                expectedEmojis.Add(pageReaction);

                await message.CreateReactionAsync(pageReaction);
            }

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
            
            if (artStyles.Count > 1)
            {
                expectedEmojis.Add(artReaction);

                await message.CreateReactionAsync(artReaction);
            }

            var reaction = await message.WaitForReactionAsync(context.Message.Author, TimeSpan.FromSeconds(Constants.TIMEOUT));

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
                    Dictionary<string, string> nextRules = rules;
                    bool nextRulesToggle = rulesToggle;
                    int nextStage = currentStage;
                    List<CardEntity> nextStages = stages;

                    if (reaction.Result.Emoji == artReaction)
                    {
                        nextArtStyle = currentArtStyle + 1 < artStyles.Count ? currentArtStyle + 1 : 0;
                        var nextChoice = artStyles[nextArtStyle];

                        await message.DeleteAllReactionsAsync();

                        DiscordEmbed embed;

                        if (nextRulesToggle)
                        {
                            embed = nextCard.BuildRulesEmbed(nextRules, artStyles[nextArtStyle]);
                        }
                        else
                        {
                            embed = nextCard.BuildEmbed(artStyles[nextArtStyle]);
                        }

                        nextMessage = await message.ModifyAsync(embed);
                    }
                    else if (reaction.Result.Emoji == flipReaction)
                    {
                        nextFace = currentFace + 1 < faces.Count ? currentFace + 1 : 0;
                        nextCard = faces[nextFace];

                        await message.DeleteAllReactionsAsync();

                        var embed = nextCard.BuildEmbed();
                        nextMessage = await message.ModifyAsync(embed);

                        nextArtStyles = nextCard.GetAlternateArts();
                        nextArtStyle = 0;

                        if (nextCard.Group != card.Group)
                        {
                            nextStages = _cardDao.FindGroup(nextCard.Group);
                        }
                        
                        nextStage = nextStages != null ? nextStages.FindIndex(x => x.RowKey == nextCard.RowKey) : -1;

                        nextRules = nextCard.EvaluateRules();
                        nextRulesToggle = false;
                    }
                    else if (reaction.Result.Emoji == leftArrowReaction)
                    {
                        nextStage = currentStage - 1 >= 0 ? currentStage - 1 : stages.Count - 1;
                        nextCard = stages[nextStage];

                        await message.DeleteAllReactionsAsync();

                        var embed = nextCard.BuildEmbed();
                        nextMessage = await message.ModifyAsync(embed);

                        nextArtStyles = nextCard.GetAlternateArts();
                        nextArtStyle = 0;

                        if (!nextCard.IsRelatedTo(card))
                        {
                            nextFaces = _cardDao.FindFaces(nextCard.RowKey);
                        }
                        
                        nextFace = nextFaces != null ? nextFaces.FindIndex(x => x.RowKey == nextCard.RowKey) : -1;

                        nextRules = nextCard.EvaluateRules();
                        nextRulesToggle = false;
                    }
                    else if (reaction.Result.Emoji == rightArrowReaction)
                    {
                        nextStage = currentStage + 1 < stages.Count ? currentStage + 1 : 0;
                        nextCard = stages[nextStage];

                        await message.DeleteAllReactionsAsync();

                        var embed = nextCard.BuildEmbed();
                        nextMessage = await message.ModifyAsync(embed);

                        nextArtStyles = nextCard.GetAlternateArts();
                        nextArtStyle = 0;

                        if (!nextCard.IsRelatedTo(card))
                        {
                            nextFaces = _cardDao.FindFaces(nextCard.RowKey);
                        }
                        
                        nextFace = nextFaces != null ? nextFaces.FindIndex(x => x.RowKey == nextCard.RowKey) : -1;

                        nextRules = nextCard.EvaluateRules();
                        nextRulesToggle = false;
                    }
                    else if (reaction.Result.Emoji == pageReaction)
                    {
                        await message.DeleteAllReactionsAsync();

                        DiscordEmbed embed;

                        if (!nextRulesToggle)
                        {
                            embed = nextCard.BuildRulesEmbed(nextRules, artStyles[currentArtStyle]);
                        }
                        else
                        {
                            embed = nextCard.BuildEmbed(artStyles[currentArtStyle]);
                        }

                        nextMessage = await message.ModifyAsync(embed);

                        nextRulesToggle = !nextRulesToggle;
                    }
                    else
                    {
                        break;
                    }

                    await Imbibe(context, nextMessage, nextCard, nextArtStyles, nextArtStyle, nextFaces, nextFace, nextStages, nextStage, nextRules, nextRulesToggle);

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