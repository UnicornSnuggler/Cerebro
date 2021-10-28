using Azure.Search.Documents.Indexes;
using Microsoft.Azure.Cosmos.Table;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace Cerebro_Utilities.Models
{
    public class CardEntity : TableEntity
    {
        public const string INDEX_NAME = "cerebrocards-index";

        public const string TABLE_NAME = "CerebroCards";

        public CardEntity() { }

        [SimpleField]
        public string Acceleration { get; set; }

        [SimpleField]
        public string Attack { get; set; }

        [SimpleField]
        public string Boost { get; set; }

        [SimpleField]
        public string Classification { get; set; }

        [SimpleField]
        public string Cost { get; set; }
        
        [SimpleField]
        public string Defense { get; set; }
        
        [SimpleField]
        public string Flavor { get; set; }

        [SimpleField]
        public string Group { get; set; }

        [SimpleField]
        public string Hand { get; set; }
        
        [SimpleField]
        public string Health { get; set; }

        [SimpleField(IsFilterable = true)]
        public bool Incomplete { get; set; }

        [SearchableField(IsFilterable = true, IsSortable = true)]
        public string Name { get; set; }

        [JsonIgnore]
        public List<PrintingEntity> Printings { get; set; }
        
        [SimpleField]
        public string Recover { get; set; }
        
        [SimpleField]
        public string Resource { get; set; }

        [SearchableField(IsFilterable = true)]
        public string Rules { get; set; }
        
        [SimpleField]
        public string Scheme { get; set; }
        
        [SimpleField]
        public bool Slash { get; set; }

        [SearchableField(IsFilterable = true)]
        public string Special { get; set; }

        [SearchableField(IsFilterable = true)]
        public string Stage { get; set; }

        [SearchableField(IsFilterable = true, IsSortable = true)]
        public string Subname { get; set; }
        
        [SimpleField]
        public string Threat { get; set; }
        
        [SimpleField]
        public string Threshold { get; set; }
        
        [SimpleField]
        public string Thwart { get; set; }

        [SearchableField(IsFilterable = true)]
        public string Traits { get; set; }

        [SearchableField(IsFilterable = true, IsSortable = true)]
        public string Type { get; set; }
        
        [SimpleField]
        public bool Unique { get; set; }
    }
}
