class RuleEntity
{
    static INDEX_NAME = 'cerebrorules-index';

    constructor (tableEntity) {
        this.Description = tableEntity.Description ?? null;
        this.Footer = tableEntity.Footer ?? null;
        this.Id = tableEntity.RowKey;
        this.Reference = tableEntity.Reference ?? null;
        this.Regex = tableEntity.Regex ?? null;
        this.Terms = tableEntity.Terms;
        this.Title = tableEntity.Title;
        this.Type = tableEntity.PartitionKey;
    }
};

module.exports = { RuleEntity };