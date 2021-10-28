using Cerebro_Utilities.Models;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface ISetDao
    {
        public void RetrieveAllSets();
    }

    public class SetDao : ISetDao
    {
        private CloudTable _cloudTable;

        public static List<SetEntity> _sets;
        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public SetDao(IConfigurationRoot configuration, ILogger<ISetDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _cloudTable = CloudStorageAccount.Parse(connectionString)
                .CreateCloudTableClient(new TableClientConfiguration())
                .GetTableReference(SetEntity.TABLE_NAME);

            RetrieveAllSets();
        }

        public void RetrieveAllSets()
        {
            _sets = new List<SetEntity>();

            IQueryable<SetEntity> entities = _cloudTable.CreateQuery<SetEntity>()
                .Select(x => x);

            foreach (SetEntity set in entities)
            {
                _sets.Add(set);
            }

            _logger.LogInformation($"Loaded {_sets.Count} sets from the database!");
        }
    }
}
