class SetEntity
{
    static TABLE_NAME = 'CerebroSets';

    constructor (tableEntity) {
        this.Incomplete = tableEntity.Incomplete._;
        this.Name = tableEntity.RowKey._;
        this.Number = tableEntity.Number._;
        this.Type = tableEntity.PartitionKey._;
    }
};

module.exports = { SetEntity };