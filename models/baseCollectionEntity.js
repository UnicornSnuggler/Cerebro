const { BaseEntity } = require('./baseEntity');

class BaseCollectionEntity extends BaseEntity {
    static DATABASE = 'cerebrocollections';

    constructor (document) {
        super(document);
        
        this.Name = document.Name;
        this.Official = document.Official;
        this.Type = document.Type;
    }
}

module.exports = { BaseCollectionEntity }