const { BaseEntity } = require('./baseEntity');

class CardEntity extends BaseEntity {
    static DATABASE = 'cerebrocards';
    static INDEX = 'officialcards';

    constructor (document) {
        super(document);

        this.Acceleration = document.Acceleration;
        this.Attack = document.Attack;
        this.Boost = document.Boost;
        this.Classification = document.Classification;
        this.Cost = document.Cost;
        this.Defense = document.Defense;
        this.Flavor = document.Flavor;
        this.GroupId = document.GroupId;
        this.Hand = document.Hand;
        this.Health = document.Health;
        this.Incomplete = document.Incomplete;
        this.Name = document.Name;
        this.Official = document.Official;
        this.Printings = document.Printings;
        this.Recover = document.Recover;
        this.Resource = document.Resource;
        this.Rules = document.Rules;
        this.Scheme = document.Scheme;
        this.SetName = document.PartitionKey;
        this.Slash = document.Slash;
        this.Special = document.Special;
        this.Stage = document.Stage;
        this.Subname = document.Subname;
        this.Threat = document.Threat;
        this.Threshold = document.Threshold;
        this.Thwart = document.Thwart;
        this.Traits = document.Traits;
        this.Type = document.Type;
        this.Unique = document.Unique;
    }
}

module.exports = { CardEntity }