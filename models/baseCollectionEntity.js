const { BaseAuthoredEntity } = require('./baseAuthoredEntity');

class BaseCollectionEntity extends BaseAuthoredEntity {
    static DATABASE_SUFFIX = 'collections';

    constructor (document) {
        super(document);
        
        this.Name = document.Name;
        this.Type = document.Type;
    }
}

module.exports = { BaseCollectionEntity }