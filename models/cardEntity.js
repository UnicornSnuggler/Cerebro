class CardEntity
{
    static INDEX_NAME = 'cerebrocards-index';

    constructor (tableEntity) {
        this.Acceleration = tableEntity.Acceleration ?? null;
        this.Attack = tableEntity.Attack ?? null;
        this.Boost = tableEntity.Boost ?? null;
        this.Classification = tableEntity.Classification;
        this.Cost = tableEntity.Cost ?? null;
        this.Defense = tableEntity.Defense ?? null;
        this.Flavor = tableEntity.Flavor ?? null;
        this.Group = tableEntity.Group ?? null;
        this.Hand = tableEntity.Hand ?? null;
        this.Health = tableEntity.Health ?? null;
        this.Id = tableEntity.RowKey;
        this.Incomplete = tableEntity.Incomplete;
        this.Name = tableEntity.Name;
        this.Recover = tableEntity.Recover ?? null;
        this.Resource = tableEntity.Resource ?? null;
        this.Rules = tableEntity.Rules ?? null;
        this.Scheme = tableEntity.Scheme ?? null;
        this.SetName = tableEntity.PartitionKey;
        this.Slash = tableEntity.Slash ?? null;
        this.Special = tableEntity.Special ?? null;
        this.Stage = tableEntity.Stage ?? null;
        this.Subname = tableEntity.Subname ?? null;
        this.Threat = tableEntity.Threat ?? null;
        this.Threshold = tableEntity.Threshold ?? null;
        this.Thwart = tableEntity.Thwart ?? null;
        this.Traits = tableEntity.Traits ?? null;
        this.Type = tableEntity.Type;
        this.Unique = tableEntity.Unique;
    }
};

module.exports = { CardEntity };