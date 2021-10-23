using Microsoft.Azure.Cosmos.Table;

namespace Cerebro_Utilities.Models
{
    public class SetEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroSets";

        public SetEntity() { }

        public string Number { get; set; }

        public string Type { get; set; }
    }
}
