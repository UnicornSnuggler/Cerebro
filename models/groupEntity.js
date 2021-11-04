const { BaseCollectionEntity } = require('./baseCollectionEntity');

class GroupEntity extends BaseCollectionEntity {
    static INDEXES = ['officialgroups'];

    constructor (document) {
        super(document);
    }
}

module.exports = { GroupEntity }