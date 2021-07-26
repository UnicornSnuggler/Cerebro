using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Bounty.Dao
{
    public interface IGenericDao
    {
        Task<TableResult> Retrieve<T>(string tableName, string partitionKey, string rowKey) where T : TableEntity;
        List<T> RetrieveByPartitionKey<T>(string tableName, string partitionKey) where T : TableEntity, new();
        Task Merge(string tableName, ITableEntity entity);
        Task Insert(string tableName, ITableEntity entity);
        Task Delete(string tableName, ITableEntity entity);
    }

    public class GenericDao : IGenericDao
    {
        private readonly IConfigurationRoot _configuration;
        private CloudStorageAccount _storageAccount;

        public GenericDao(IConfigurationRoot configuration)
        {
            _configuration = configuration;
            _storageAccount = CloudStorageAccount.Parse(_configuration.GetValue<string>(Constants.CONFIG_STORAGE));
        }

        public async Task<TableResult> Retrieve<T>(string tableName, string partitionKey, string rowKey) where T : TableEntity
        {
            try
            {
                var table = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(tableName);

                return await table.ExecuteAsync(TableOperation.Retrieve<T>(partitionKey, rowKey));
            }
            catch (StorageException error)
            {
                if (error.RequestInformation.HttpStatusCode == 404)
                {
                    return null;
                }

                throw;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public List<T> RetrieveByPartitionKey<T>(string tableName, string partitionKey) where T : TableEntity, new()
        {
            try
            {
                var table = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(tableName);

                var filter = TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, partitionKey);

                return table.ExecuteQuery(new TableQuery<T>().Where(filter)).ToList();
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task Merge(string tableName, ITableEntity entity)
        {
            try
            {
                var table = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(tableName);

                await table.ExecuteAsync(TableOperation.Merge(entity));
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task Insert(string tableName, ITableEntity entity)
        {
            try
            {
                var table = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(tableName);

                await table.ExecuteAsync(TableOperation.Insert(entity));
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task Delete(string tableName, ITableEntity entity)
        {
            try
            {
                var table = _storageAccount.CreateCloudTableClient(new TableClientConfiguration()).GetTableReference(tableName);

                await table.ExecuteAsync(TableOperation.Delete(entity));
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}