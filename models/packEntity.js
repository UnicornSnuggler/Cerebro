const { BaseCollectionEntity } = require('./baseCollectionEntity');

class PackEntity extends BaseCollectionEntity {
    static COLLECTION = 'packs';

    constructor (document) {
        super(document);
    }
}

module.exports = { PackEntity }