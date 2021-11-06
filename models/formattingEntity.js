const { BaseEntity } = require('./baseEntity');

class FormattingEntity extends BaseEntity {
    static DATABASE_SUFFIX = 'formattings';
    static COLLECTION = 'generalformattings';

    constructor (document) {
        super(document);

        this.Match = document.Match;
        this.Operation = document.Operation;
        this.Priority = document.Priority;
        this.Regex = document.Regex;
        this.Replacement = document.Replacement;
    }
}

module.exports = { FormattingEntity }