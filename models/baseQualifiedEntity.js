const { BaseEntity } = require('./baseEntity');

class BaseQualifiedEntity extends BaseEntity {
    constructor (document) {
        super(document);
        
        this.Official = document.Official;
    }
}

module.exports = { BaseQualifiedEntity }