class GroupEntity
{
    static TABLE_NAME = 'CerebroGroups';

    constructor (tableEntity) {
        this.Guid = tableEntity.RowKey._;
        this.Name = tableEntity.Name._;
        this.Type = tableEntity.PartitionKey._;
    }
};

module.exports = { GroupEntity };