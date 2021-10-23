using Microsoft.Azure.Cosmos.Table;

namespace Cerebro_Utilities.Models
{
    public class RuleEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroRules";

        public RuleEntity() { }

        public bool Magnitude { get; set; }

        public string Description { get; set; }
    }
}
