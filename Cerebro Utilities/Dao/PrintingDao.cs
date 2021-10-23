using Cerebro_Utilities.Models;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface IPrintingDao
    {
        List<PrintingEntity> GetPrintings(string cardId);
    }

    public class PrintingDao : IPrintingDao
    {
        private CloudTable _cloudTable;

        private readonly IConfigurationRoot _configuration;

        public PrintingDao(IConfigurationRoot configuration)
        {
            _configuration = configuration;

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _cloudTable = CloudStorageAccount.Parse(connectionString)
                .CreateCloudTableClient(new TableClientConfiguration())
                .GetTableReference(PrintingEntity.TABLE_NAME);
        }

        public List<PrintingEntity> GetPrintings(string cardId)
        {
            IQueryable<PrintingEntity> entities = _cloudTable.CreateQuery<PrintingEntity>()
                .Where(x => x.ArtificialId == cardId)
                .Select(x => x);

            List<PrintingEntity> printings = new List<PrintingEntity>();

            foreach(PrintingEntity printing in entities)
            {
                printing.Pack = PackDao._packs.Find(x => x.Id == printing.PackName);

                printings.Add(printing);
            }

            return printings;
        }
    }
}
