using Cerebro.Attributes;
using Cerebro.Dao;
using Cerebro.Extensions;
using Cerebro.Models;
using DSharpPlus.CommandsNext;
using DSharpPlus.CommandsNext.Attributes;
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
        private readonly ICardDao _cardDao;

        public SearchCommandModule(ILogger<SearchCommandModule> logger, ICardDao cardDao)
        {
            _logger = logger;
            _cardDao = cardDao;
        }

        [Command("name")]
        [Description("Retrieve a card by name.")]
        public async Task CardCommand(CommandContext context, [Description("The name of the card being queried.")] [RemainingText] string cardName)
        {
            List<CardEntity> results = _cardDao.RetrieveByName(cardName);

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

                    List<CardEntity> relatedCards = _cardDao.FindRelatedCards(card);

                    if (relatedCards != null)
                    {
                        context.MakeFlippable(message, relatedCards, card);
                    }
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

                        List<CardEntity> relatedCards = _cardDao.FindRelatedCards(card);

                        if (relatedCards != null)
                        {
                            context.MakeFlippable(message, relatedCards, card);
                        }
                    }
                }
            }
        }
    }
}