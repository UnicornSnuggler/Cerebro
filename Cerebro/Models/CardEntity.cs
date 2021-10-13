using Cerebro.Extensions;
using Microsoft.Azure.Cosmos.Table;
using System;
using System.Collections.Generic;

namespace Cerebro.Models
{
    public class CardEntity : TableEntity,  IEquatable<CardEntity>
    {
        public const string TABLE_NAME = "CerebroCards";

        public CardEntity() { }

        public bool Equals(CardEntity card)
        {
            if (ReferenceEquals(card, null)) return false;

            if (ReferenceEquals(this, card)) return true;

            return this.IsRelatedTo(card);
        }

        public override int GetHashCode()
        {
            string baseId = RowKey.Substring(0, Constants.ID_LENGTH);

            return baseId.GetHashCode();
        }

        public string Acceleration { get; set; }

        public string Attack { get; set; }

        public string Boost { get; set; }

        public string Classification { get; set; }

        public string Cost { get; set; }

        public string Defense { get; set; }

        public string Flavor { get; set; }

        public string Hand { get; set; }

        public string Health { get; set; }

        public string Image { get; set; }

        public string Name { get; set; }

        public List<PrintingEntity> Printings { get; set; }

        public string Recover { get; set; }

        public string Resource { get; set; }

        public string Rules { get; set; }

        public string Scheme { get; set; }

        public string Special { get; set; }

        public string Stage { get; set; }

        public string Subname { get; set; }

        public string Threat { get; set; }

        public string Threshold { get; set; }

        public string Thwart { get; set; }

        public string Traits { get; set; }

        public string Type { get; set; }

        public bool Unique { get; set; }
    }
}
