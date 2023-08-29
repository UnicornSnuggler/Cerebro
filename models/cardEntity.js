const { BaseAuthoredEntity } = require('./baseAuthoredEntity');

class CardEntity extends BaseAuthoredEntity {
    static DATABASE_SUFFIX = 'cards';
    static COLLECTION = 'cards';

    constructor (document) {
        super(document);

        this.Acceleration = document.Acceleration;
        this.ArtificialPackId = document.ArtificialPackId;
        this.Artists = document.Artists;
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
        this.Printings = document.Printings;
        this.Queries = document.Queries;
        this.Recover = document.Recover;
        this.Resource = document.Resource;
        this.Rules = document.Rules;
        this.Scheme = document.Scheme;
        this.Slash = document.Slash;
        this.Special = document.Special;
        this.SpoilerTag = document.SpoilerTag;
        this.Stage = document.Stage;
        this.StartingThreat = document.StartingThreat;
        this.Subname = document.Subname;
        this.TargetThreat = document.TargetThreat;
        this.Thwart = document.Thwart;
        this.Traits = document.Traits;
        this.Type = document.Type;
        this.Unique = document.Unique;
    }
}

module.exports = { CardEntity }