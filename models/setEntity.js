const { BaseCollectionEntity } = require('./baseCollectionEntity');

class SetEntity extends BaseCollectionEntity {
    static COLLECTION = 'sets';

    constructor (document) {
        super(document);

        this.CouncilNumber = document.CouncilNumber;
        this.Incomplete = document.Incomplete;
        this.Number = document.Number;
    }
}

module.exports = { SetEntity }