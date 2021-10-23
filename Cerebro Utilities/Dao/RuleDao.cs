using Cerebro_Utilities.Models;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface IRuleDao
    {
        public void RetrieveAllRules();
    }

    public class RuleDao : IRuleDao
    {
        private CloudTable _cloudTable;

        public static List<RuleEntity> _rules;
        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public RuleDao(IConfigurationRoot configuration, ILogger<IRuleDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _cloudTable = CloudStorageAccount.Parse(connectionString)
                .CreateCloudTableClient(new TableClientConfiguration())
                .GetTableReference(RuleEntity.TABLE_NAME);

            RetrieveAllRules();
        }

        public void RetrieveAllRules()
        {
            _rules = new List<RuleEntity>();

            IQueryable<RuleEntity> entities = _cloudTable.CreateQuery<RuleEntity>()
                .Select(x => x);

            foreach (RuleEntity rule in entities)
            {
                _rules.Add(rule);
            }

            _logger.LogInformation($"Loaded {_rules.Count} rules from the database!");
        }
    }
}
