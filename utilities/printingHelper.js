exports.Summary = function(printing)
{
    if (printing.Set.Incomplete)
    {
        return "[Redacted]";
    }
    else
    {
        var summary = `${printing.SetName} #${printing.SetNumber}`;

        if (printing.Pack != null)
        {
            summary += `, ${printing.Pack.Name}`;

            if (printing.PackNumber != null)
            {
                summary += ` #${printing.PackNumber}`;
            }
        }

        return summary;
    }
};