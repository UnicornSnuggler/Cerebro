const { BaseCollectionEntity } = require('./baseCollectionEntity');

class SetEntity extends BaseCollectionEntity {
    static COLLECTION = 'sets';

    constructor (document) {
        super(document);

        this.CanSimulate = document.CanSimulate;
        this.Deviation = document.Deviation;
        this.Modulars = document.Modulars;
        this.PackId = document.PackId;
        this.Requires = document.Requires;
    }
}

module.exports = { SetEntity }