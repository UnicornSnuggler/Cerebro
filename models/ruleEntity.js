const { BaseQualifiedEntity } = require('./baseQualifiedEntity');

class RuleEntity extends BaseQualifiedEntity {
    static DATABASE_SUFFIX = 'rules';
    static COLLECTION = 'rules';

    constructor (document) {
        super(document);

        this.AuthorId = document.AuthorId;
        this.Description = document.Description;
        this.Footer = document.Footer;
        this.Incomplete = document.Incomplete;
        this.Reference = document.Reference;
        this.Regex = document.Regex;
        this.Terms = document.Terms;
        this.Title = document.Title;
        this.Type = document.Type;
    }
}

module.exports = { RuleEntity }