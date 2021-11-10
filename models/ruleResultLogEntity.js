const { BaseLogEntity } = require('./baseLogEntity');

class RuleResultLogEntity extends BaseLogEntity {
    static COLLECTION = 'ruleresults';

    constructor (document) {
        super(document);

        this.RuleId = document.RuleId;
    }
}

module.exports = { RuleResultLogEntity }