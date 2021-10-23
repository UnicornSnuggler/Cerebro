using Cerebro_Utilities.Models;
using System.Collections.Generic;

namespace Cerebro_Utilities.Extensions
{
    internal static class CardEntityExtensions
    {
        internal static string GetBaseId(this CardEntity card)
        {
            return card.RowKey.Substring(0, Constants.ID_LENGTH);
        }

        internal static List<PrintingEntity> GetReprints(this CardEntity card)
        {
            List<PrintingEntity> reprints = card.Printings.FindAll(x => !x.IsOriginalPrinting());

            if (reprints.Count == 0)
            {
                return null;
            }
            else
            {
                return reprints;
            }
        }

        internal static bool IsFaceOf(this CardEntity thisCard, CardEntity thatCard)
        {
            if (thisCard.RowKey.Length > Constants.ID_LENGTH && thatCard.RowKey.Length > Constants.ID_LENGTH)
            {
                return thisCard.RowKey != thatCard.RowKey && thisCard.RowKey.Contains(thatCard.GetBaseId());
            }
            else
            {
                return false;
            }
        }

        internal static bool IsGroupedWith(this CardEntity thisCard, CardEntity thatCard)
        {
            if (thisCard.Group != null && thatCard.Group != null)
            {
                return thisCard.Group == thatCard.Group;
            }
            else
            {
                return false;
            }
        }
    }
}
