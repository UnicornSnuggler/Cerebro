using Microsoft.Azure.Cosmos.Table;

namespace Cerebro_Utilities.Models
{
    public class PackEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroPacks";

        public PackEntity() { }

        public string Id { get; set; }

        public override string ToString()
        {
            return $"{RowKey} {PartitionKey}";
        }
    }
}
