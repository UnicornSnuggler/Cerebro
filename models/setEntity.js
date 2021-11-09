const { BaseCollectionEntity } = require('./baseCollectionEntity');

class SetEntity extends BaseCollectionEntity {
    static COLLECTION = 'sets';

    constructor (document) {
        super(document);
    }
}

module.exports = { SetEntity }