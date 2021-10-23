using Cerebro_Utilities.Models;
using System.Text;

namespace Cerebro.Extensions
{
    internal static class PrintingEntityExtensions
    {
        internal static string Summary(this PrintingEntity printing)
        {
            StringBuilder summary = new StringBuilder($"{printing.PartitionKey} #{printing.SetNumber}");

            if (printing.Pack != null)
            {
                summary.Append($", {printing.Pack.Name}");

                if (printing.PackNumber != null)
                {
                    summary.Append($" #{printing.PackNumber}");
                }
            }

            return summary.ToString();
        }
    }
}
