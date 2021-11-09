const { BaseCollectionEntity } = require('./baseCollectionEntity');

class PackEntity extends BaseCollectionEntity {
    static COLLECTION = 'packs';

    constructor (document) {
        super(document);

        this.CouncilNumber = document.CouncilNumber;
        this.Incomplete = document.Incomplete;
        this.Number = document.Number;
    }
}

module.exports = { PackEntity }