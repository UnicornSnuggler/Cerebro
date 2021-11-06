const { BaseQualifiedEntity } = require('./baseQualifiedEntity');

class CardEntity extends BaseQualifiedEntity {
    static DATABASE_SUFFIX = 'cards';
    static COLLECTION = 'cards';

    constructor (document) {
        super(document);

        this.Acceleration = document.Acceleration;
        this.Attack = document.Attack;
        this.AuthorId = document.AuthorId;
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
        this.Printings = document.Printings;
        this.Recover = document.Recover;
        this.Resource = document.Resource;
        this.Rules = document.Rules;
        this.Scheme = document.Scheme;
        this.Slash = document.Slash;
        this.Special = document.Special;
        this.Stage = document.Stage;
        this.Subname = document.Subname;
        this.StartingThreat = document.StartingThreat;
        this.TargetThreat = document.TargetThreat;
        this.Thwart = document.Thwart;
        this.Traits = document.Traits;
        this.Type = document.Type;
        this.Unique = document.Unique;
    }
}

module.exports = { CardEntity }