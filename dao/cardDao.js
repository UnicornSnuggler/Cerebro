const { ID_LENGTH } = require('../constants');
const { CardEntity } = require('../models/cardEntity');
const { GetBaseId, ShareFaces, ShareGroups } = require('../utilities/cardHelper');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

const TrimDuplicates = function(cards) {
    var results = [];

    for (var card of cards) {
        if (!results.some(x => ShareFaces(card, x) || ShareGroups(card, x))) {
            results.push(card);
        }
    }

    return results;
}

class CardDao {
    constructor() {}

    static store = CreateDocumentStore(CardEntity.DATABASE).initialize();

    static async FindFaces(card) {
        if (card.Id.length === ID_LENGTH) return null;

        var results = [];

        var documents = await this.store.openSession().query({ indexName: CardEntity.INDEX })
            .whereRegex('Id', GetBaseId(card))
            .orderBy('Id').all();

        for (var document of documents) {
            results.push(new CardEntity(document));
        }

        return results.length > 1 ? results : null;
    }

    static async FindStages(card) {
        if (!card.GroupId) return null;

        var results = [];

        var documents = await this.store.openSession().query({ indexName: CardEntity.INDEX })
            .whereRegex('GroupId', card.GroupId)
            .orderBy('GroupId').all();

        for (var document of documents) {
            results.push(new CardEntity(document));
        }

        return results.length > 1 ? results : null;
    }

    static async FindFacesAndStages(card) {
        var collection = {
            cards: [],
            faces: [],
            stages: []
        }

        if (card.Type === 'Villain' || card.Type === 'Main Scheme') {
            var stages = await this.FindStages(card);
            
            if (stages) {
                for (var stage of stages) {
                    collection.cards.push(stage);

                    var stageEntry = {
                        cardId: stage.Id,
                        faces: null
                    };

                    if (stage.Id.length > ID_LENGTH) stageEntry.faces = stages.filter(x => x.Id.includes(GetBaseId(stage))).map(x => x.Id);

                    collection.stages.push(stageEntry);
                }
                
                var currentStage = collection.stages.find(x => x.cardId === card.Id);

                if (currentStage.faces) collection.faces = currentStage.faces;

                return collection;
            }
            else {
                var faces = await this.FindFaces(card);

                if (faces) {
                    for (var face of faces) {
                        collection.cards.push(face);
                        collection.faces.push(face.Id);
                    }

                    return collection;
                }
            }
        }
        else {
            var faces = await this.FindFaces(card);

            if (faces) {
                for (var face of faces) {
                    collection.cards.push(face);
                    collection.faces.push(face.Id);
                }

                return collection;
            }
        }

        collection.cards.push(card);
        
        return collection;
    }

    static async RetrieveByName(terms) {        
        const session = this.store.openSession();

        terms = terms.toLowerCase();

        var query = terms.replace(/[^a-zA-Z0-9]/gmi, '');

        var results = await session.query({ indexName: CardEntity.INDEX })
            .whereRegex('Id', query).orElse()
            .whereRegex('Name', query).orElse()
            .whereRegex('Subname', query).orElse()
            .whereRegex('StrippedName', query).orElse()
            .whereRegex('StrippedSubname', query)
            .orderBy('Id').all();

        if (results.length === 0) {
            results = await session.query({ indexName: CardEntity.INDEX })
                .whereEquals('Id', query).fuzzy(0.70).orElse()
                .whereEquals('Name', query).fuzzy(0.70).orElse()
                .whereEquals('Subname', query).fuzzy(0.70).orElse()
                .whereEquals('StrippedName', query).fuzzy(0.70).orElse()
                .whereEquals('StrippedSubname', query).fuzzy(0.70)
                .orderBy('Id').all();
        }

        if (results.length > 0) {
            var matches = results.filter(function(card) {
                return card.Name.toLowerCase() === terms || (card.Subname != null && card.Subname.toLowerCase() === terms) || card.Id.toLowerCase() === terms;
            });

            return TrimDuplicates(matches.length > 0 ? matches : results);
        }
    }
}

module.exports = { CardDao }