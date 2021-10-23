using Azure.Search.Documents.Indexes;
using Microsoft.Azure.Cosmos.Table;
using Newtonsoft.Json;

namespace Cerebro_Utilities.Models
{
    public class PrintingEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroPrintings";

        public PrintingEntity() { }

        [SimpleField]
        public bool AlternateArt { get; set; }

        [SimpleField]
        public string ArtificialId { get; set; }

        [SimpleField]
        public string PackName { get; set; }

        [SimpleField]
        public string PackNumber { get; set; }

        [SimpleField]
        public string SetNumber { get; set; }

        [JsonIgnore]
        public PackEntity Pack { get; set; }
    }
}
