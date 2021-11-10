const { BaseOrganizedLogEntity } = require('./baseOrganizedLogEntity');

class CollectionResultLogEntity extends BaseOrganizedLogEntity {
    static COLLECTION = 'collectionresults';

    constructor (document) {
        super(document);
    }
}

module.exports = { CollectionResultLogEntity }