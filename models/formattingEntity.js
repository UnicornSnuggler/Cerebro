class FormattingEntity
{
    static TABLE_NAME = 'CerebroFormattings';

    constructor (tableEntity) {
        this.Guid = tableEntity.RowKey._;
        this.Operation = tableEntity.PartitionKey._;
        this.Priority = tableEntity.Priority._;
        this.Regex = tableEntity.Regex ? tableEntity.Regex._ : null;
        this.Replacement = tableEntity.Replacement ? tableEntity.Replacement._ : null;
        this.Text = tableEntity.Text ? tableEntity.Text._ : null;
    }
};

module.exports = { FormattingEntity };