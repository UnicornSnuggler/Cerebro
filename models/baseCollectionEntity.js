const { BaseQualifiedEntity } = require('./baseQualifiedEntity');

class BaseCollectionEntity extends BaseQualifiedEntity {
    static DATABASE_SUFFIX = 'collections';

    constructor (document) {
        super(document);
        
        this.Name = document.Name;
        this.Type = document.Type;
    }
}

module.exports = { BaseCollectionEntity }