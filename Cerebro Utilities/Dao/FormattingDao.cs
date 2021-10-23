using Cerebro_Utilities.Models;
using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace Cerebro_Utilities.Dao
{
    public interface IFormattingDao
    {
        public void RetrieveAllFormattings();
    }

    public class FormattingDao : IFormattingDao
    {
        private CloudTable _cloudTable;

        public static List<FormattingEntity> _formattings;
        private readonly IConfigurationRoot _configuration;
        private readonly ILogger _logger;

        public FormattingDao(IConfigurationRoot configuration, ILogger<ICardDao> logger)
        {
            _configuration = configuration;
            _logger = logger;

            _formattings = new List<FormattingEntity>();

            string connectionString = _configuration.GetValue<string>(Constants.CONFIG_STORAGE);

            _cloudTable = CloudStorageAccount.Parse(connectionString)
                .CreateCloudTableClient(new TableClientConfiguration())
                .GetTableReference(FormattingEntity.TABLE_NAME);

            RetrieveAllFormattings();
        }

        public void RetrieveAllFormattings()
        {
            _formattings = new List<FormattingEntity>();

            IQueryable<FormattingEntity> entities = _cloudTable.CreateQuery<FormattingEntity>()
                .Select(x => x);

            foreach (FormattingEntity formatting in entities)
            {
                _formattings.Add(formatting);
            }

            _logger.LogInformation($"Loaded {_formattings.Count} formattings from the database!");
        }
    }
}
