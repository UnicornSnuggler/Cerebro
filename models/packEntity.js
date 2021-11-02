class PackEntity
{
    static TABLE_NAME = 'CerebroPacks';

    constructor (tableEntity) {
        this.Id = tableEntity.RowKey._;
        this.Name = tableEntity.Name._;
        this.Type = tableEntity.PartitionKey._;
    }

    ToString() {
        return `${this.Name} ${this.PartitionKey}`;
    };
};

module.exports = { PackEntity };