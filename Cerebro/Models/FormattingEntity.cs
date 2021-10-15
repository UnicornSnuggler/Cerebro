using Microsoft.Azure.Cosmos.Table;

namespace Cerebro.Models
{
    public class FormattingEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroFormattings";

        public FormattingEntity() { }

        public string Priority { get; set; }

        public string Regex { get; set; }

        public string Replacement { get; set; }

        public string Text { get; set; }
    }
}
