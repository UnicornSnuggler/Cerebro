using Cerebro_Utilities.Models;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface IPackDao
    {
        public void RetrieveAllPacks();
    }

    public class PackDao : IPackDao
    {
        private CloudTable _cloudTable;

        public static List<PackEntity> _packs;
        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public PackDao(IConfigurationRoot configuration, ILogger<IPackDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            _packs = new List<PackEntity>();

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _cloudTable = CloudStorageAccount.Parse(connectionString)
                .CreateCloudTableClient(new TableClientConfiguration())
                .GetTableReference(PackEntity.TABLE_NAME);

            RetrieveAllPacks();
        }

        public void RetrieveAllPacks()
        {
            _packs = new List<PackEntity>();

            IQueryable<PackEntity> entities = _cloudTable.CreateQuery<PackEntity>()
                .Select(x => x);

            foreach (PackEntity pack in entities)
            {
                _packs.Add(pack);
            }

            _logger.LogInformation($"Loaded {_packs.Count} packs from the database!");
        }
    }
}
