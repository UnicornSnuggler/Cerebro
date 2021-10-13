using Microsoft.Azure.Cosmos.Table;

namespace Cerebro.Models
{
    public class SetEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroSets";

        public SetEntity() { }

        public string Number { get; set; }

        public string Type { get; set; }
    }
}
