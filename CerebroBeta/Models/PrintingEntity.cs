﻿using Microsoft.Azure.Cosmos.Table;

namespace CerebroBeta.Models
{
    public class PrintingEntity : TableEntity
    {
        public const string TABLE_NAME = "CerebroPrintings";

        public PrintingEntity() { }

        public string ArtificialId { get; set; }

        public string PackName { get; set; }

        public string PackNumber { get; set; }

        public string SetNumber { get; set; }
    }
}
