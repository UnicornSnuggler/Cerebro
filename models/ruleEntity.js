const { BaseEntity } = require('./baseEntity');

class RuleEntity extends BaseEntity
{
    static DATABASE = 'cerebrorules';
    static INDEX = 'officialrules';

    constructor (document) {
        super(document);

        this.Description = document.Description;
        this.Footer = document.Footer;
        this.Incomplete = document.Incomplete;
        this.Official = document.Official;
        this.Reference = document.Reference;
        this.Regex = document.Regex;
        this.Terms = document.Terms;
        this.Title = document.Title;
        this.Type = document.Type;
    }
};

module.exports = { RuleEntity };