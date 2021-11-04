const { BaseCollectionEntity } = require('./baseCollectionEntity');

class PackEntity extends BaseCollectionEntity {
    static INDEXES = ['officialpacks'];

    constructor (document) {
        super(document);
    }
}

module.exports = { PackEntity }