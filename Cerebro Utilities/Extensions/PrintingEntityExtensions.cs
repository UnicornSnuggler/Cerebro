using Cerebro_Utilities.Models;

namespace Cerebro_Utilities.Extensions
{
    internal static class PrintingEntityExtensions
    {
        internal static bool IsOriginalPrinting(this PrintingEntity printing)
        {
            return printing.RowKey == printing.ArtificialId;
        }
    }
}
