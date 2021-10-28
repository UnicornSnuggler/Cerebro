using Microsoft.Azure.Cosmos.Table;

namespace Cerebro_Utilities.Models
{
    public class RuleEntity : TableEntity
    {
        public const string INDEX_NAME = "cerebrorules-index";

        public const string TABLE_NAME = "CerebroRules";

        public RuleEntity() { }

        public string Description { get; set; }

        public string Footer { get; set; }

        public string Reference { get; set; }

        public string Regex { get; set; }

        public string Terms { get; set; }

        public string Title { get; set; }
    }
}
