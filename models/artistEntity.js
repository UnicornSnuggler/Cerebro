const { BaseEntity } = require('./baseEntity');

class ArtistEntity extends BaseEntity {
    static DATABASE_SUFFIX = 'collections';
    static COLLECTION = 'artists';

    constructor (document) {
        super(document);
        
        this.Name = document.Name;
    }
}

module.exports = { ArtistEntity }