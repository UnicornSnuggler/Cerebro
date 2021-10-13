using Cerebro.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Cerebro.Extensions
{
    internal static class PrintingEntityExtensions
    {
        internal static string Summary(this PrintingEntity printing)
        {
            StringBuilder summary = new StringBuilder($"{printing.PartitionKey} #{printing.SetNumber}");

            if (printing.PackName != null)
            {
                summary.Append($", {printing.PackName}");

                if (printing.PackNumber != null)
                {
                    summary.Append($" #{printing.PackNumber}");
                }
            }

            return summary.ToString();
        }
    }
}
