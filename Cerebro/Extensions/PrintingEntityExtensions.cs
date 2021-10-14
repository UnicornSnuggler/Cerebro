using Cerebro.Models;
using System.Text;

namespace Cerebro.Extensions
{
    internal static class PrintingEntityExtensions
    {
        internal static bool IsOriginalPrinting(this PrintingEntity printing)
        {
            return printing.RowKey == printing.ArtificialId;
        }

        internal static string Summary(this PrintingEntity printing)
        {
            StringBuilder summary = new StringBuilder($"{printing.PartitionKey} #{printing.SetNumber}");

            if (printing.Pack != null)
            {
                summary.Append($", {printing.Pack.RowKey}");

                if (printing.PackNumber != null)
                {
                    summary.Append($" #{printing.PackNumber}");
                }
            }

            return summary.ToString();
        }
    }
}
