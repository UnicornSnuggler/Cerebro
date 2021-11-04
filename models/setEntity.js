const { BaseCollectionEntity } = require('./baseCollectionEntity');

class SetEntity extends BaseCollectionEntity
{
    static INDEXES = ['officialsets'];

    constructor (document) {
        super(document);

        this.Incomplete = document.Incomplete;
        this.Number = document.Number;
    }
};

module.exports = { SetEntity };