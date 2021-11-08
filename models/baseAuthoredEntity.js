const { BaseQualifiedEntity } = require('./baseQualifiedEntity');

class BaseAuthoredEntity extends BaseQualifiedEntity {
    constructor (document) {
        super(document);
        
        this.AuthorId = document.AuthorId;
    }
}

module.exports = { BaseAuthoredEntity }