const { BaseOrganizedLogEntity } = require('./baseOrganizedLogEntity');

class CardResultLogEntity extends BaseOrganizedLogEntity {
    static COLLECTION = 'cardresults';

    constructor (document) {
        super(document);

        this.CardId = document.CardId;
    }
}

module.exports = { CardResultLogEntity }