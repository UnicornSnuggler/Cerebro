const { BaseMongoEntity } = require('./baseMongoEntity');

class DeckEntity extends BaseMongoEntity {
    static DATABASE = 'cerebrodecks';
    static COLLECTION = 'decks';

    constructor (document) {
        super(document);

        if (document.hasOwnProperty('aspects')) this.aspects = document.aspects;
        if (document.hasOwnProperty('authorId')) this.authorId = document.authorId;
        if (document.hasOwnProperty('cards')) this.cards = document.cards;
        if (document.hasOwnProperty('description')) this.description = document.description;
        if (document.hasOwnProperty('heroSetId')) this.heroSetId = document.heroSetId;
        if (document.hasOwnProperty('isOfficial')) this.isOfficial = document.isOfficial;
        if (document.hasOwnProperty('isPublic')) this.isPublic = document.isPublic;
        if (document.hasOwnProperty('title')) this.title = document.title;
    }
}

module.exports = { DeckEntity }