const { BaseCollectionEntity } = require('./baseCollectionEntity');

class GroupEntity extends BaseCollectionEntity {
    static COLLECTION = 'groups';

    constructor (document) {
        super(document);
    }
}

module.exports = { GroupEntity }