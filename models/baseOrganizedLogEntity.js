const { BaseLogEntity } = require('./baseLogEntity');

class BaseOrganizedLogEntity extends BaseLogEntity {
    constructor (document) {
        super(document);

        this.PackId = document.PackId;
        this.SetId = document.SetId;
    }
}

module.exports = { BaseOrganizedLogEntity }