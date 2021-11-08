const { BaseEntity } = require('./baseEntity');

class AuthorEntity extends BaseEntity {
    static DATABASE_SUFFIX = 'collections';
    static COLLECTION = 'authors';

    constructor (document) {
        super(document);
        
        this.Name = document.Name;
    }
}

module.exports = { AuthorEntity }