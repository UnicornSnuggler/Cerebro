using Microsoft.Azure.Cosmos.Table;

namespace Cerebro.Models
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
