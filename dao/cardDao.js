const { GroupDao } = require('./groupDao');
const { CardEntity } = require('../models/cardEntity');
const { NavigationCollection } = require('../models/navigationCollection');
const { GetBaseId, ShareFaces, ShareGroups } = require('../utilities/cardHelper');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');
const { OFFICIAL, UNOFFICIAL } = require('../constants');

const TrimDuplicates = function(cards) {
    let results = [];

    cards.sort((a, b) => a.Id - b.Id);

    for (let card of cards) {
        if (!results.some(x => (x.Subname && card.Subname && ShareFaces(card, x)) || ShareGroups(card, x))) {
            results.push(card);
        }
    }

    return results;
}

class CardDao {
    constructor() {}

    static store = CreateDocumentStore(DeriveDatabase(CardEntity.DATABASE_SUFFIX)).initialize();

    static async FindFaces(card) {
        let baseId = GetBaseId(card);

        if (card.Id.length === baseId.length) return null;

        let index = `${card.Official ? OFFICIAL : UNOFFICIAL}${CardEntity.COLLECTION}`;

        let results = [];

        let documents = await this.store.openSession().query({ indexName: index })
            .whereRegex('id()', baseId)
            .orderBy('id()').all();

        for (let document of documents) {
            results.push(new CardEntity(document));
        }

        return results.length > 1 ? results : null;
    }

    static async FindElements(card) {
        if (!card.GroupId) return null;

        let index = `${card.Official ? OFFICIAL : UNOFFICIAL}${CardEntity.COLLECTION}`;

        let results = [];

        let documents = await this.store.openSession().query({ indexName: index })
            .whereRegex('GroupId', card.GroupId)
            .orderBy('id()').all();

        for (let document of documents) {
            results.push(new CardEntity(document));
        }

        return results.length > 1 ? results : null;
    }

    static async FindFacesAndElements(card) {
        let collection = new NavigationCollection();

        if (card.GroupId) {
            let group = GroupDao.GROUPS.find(x => x.Id === card.GroupId);

            collection.tag = group.Type === 'Composition' ? 'Component' : 'Stage';

            let elements = await this.FindElements(card);
            
            if (elements) {
                for (let element of elements) {
                    collection.cards.push(element);

                    let collectionEntry = {
                        cardId: element.Id,
                        faces: null
                    };

                    let baseId = GetBaseId(element);

                    if (element.Id.length != baseId.length) collectionEntry.faces = elements.filter(x => x.Id.includes(baseId)).map(x => x.Id);

                    collection.elements.push(collectionEntry);
                }
                
                let currentElement = collection.elements.find(x => x.cardId === card.Id);

                if (currentElement.faces) collection.faces = currentElement.faces;

                return collection;
            }
            else {
                let faces = await this.FindFaces(card);

                if (faces) {
                    for (let face of faces) {
                        collection.cards.push(face);
                        collection.faces.push(face.Id);
                    }

                    return collection;
                }
            }
        }
        else {
            let faces = await this.FindFaces(card);

            if (faces) {
                for (let face of faces) {
                    collection.cards.push(face);
                    collection.faces.push(face.Id);
                }

                return collection;
            }
        }

        collection.cards.push(card);
        
        return collection;
    }

    static async RetrieveByName(terms, official) {
        const session = this.store.openSession();

        terms = terms.toLowerCase();

        let index = `${official ? OFFICIAL : UNOFFICIAL}${CardEntity.COLLECTION}`;
        let convertedQuery = terms.normalize('NFD').replace(/[\u0300-\u036f]/gmi, '').toLowerCase();
        let tokenizedQuery = convertedQuery.replace(/[^a-z0-9 -]/gmi, '').replace(/[-]/gmi, ' ');
        let strippedQuery = convertedQuery.replace(/[^a-z0-9]/gmi, '');

        let documents = await session.query({ indexName: index })
            .search('id()', convertedQuery, 'AND').orElse()
            .search('Name', convertedQuery, 'AND').orElse()
            .search('TokenizedName', tokenizedQuery, 'AND').orElse()
            .search('StrippedName', strippedQuery, 'AND').orElse()
            .search('Subname', convertedQuery, 'AND').orElse()
            .search('TokenizedSubname', tokenizedQuery, 'AND').orElse()
            .search('StrippedSubname', strippedQuery, 'AND')
            .all();

        if (documents.length === 0) {
            documents = await session.query({ indexName: index })
                .whereLucene('Name', convertedQuery).orElse()
                .whereLucene('TokenizedName', tokenizedQuery).orElse()
                .whereLucene('StrippedName', strippedQuery).orElse()
                .whereLucene('Subname', convertedQuery).orElse()
                .whereLucene('TokenizedSubname', tokenizedQuery).orElse()
                .whereLucene('StrippedSubname', strippedQuery)
                .all();
        
            if (documents.length === 0) {
                documents = await session.query({ indexName: index })
                    .whereRegex('id()', convertedQuery).orElse()
                    .whereRegex('Name', convertedQuery).orElse()
                    .whereRegex('TokenizedName', tokenizedQuery).orElse()
                    .whereRegex('StrippedName', strippedQuery).orElse()
                    .whereRegex('Subname', convertedQuery).orElse()
                    .whereRegex('TokenizedSubname', tokenizedQuery).orElse()
                    .whereRegex('StrippedSubname', strippedQuery)
                    .all();

                if (documents.length === 0) {
                    documents = await session.query({ indexName: index })
                        .whereEquals('Name', convertedQuery).fuzzy(0.70).orElse()
                        .whereEquals('TokenizedName', tokenizedQuery).fuzzy(0.70).orElse()
                        .whereEquals('StrippedName', strippedQuery).fuzzy(0.70).orElse()
                        .whereEquals('Subname', convertedQuery).fuzzy(0.70).orElse()
                        .whereEquals('TokenizedSubname', tokenizedQuery).fuzzy(0.70).orElse()
                        .whereEquals('StrippedSubname', strippedQuery).fuzzy(0.70)
                        .all();
                }
            }
        }

        if (documents.length > 0) {
            let results = [];

            for (let document of documents) {
                results.push(new CardEntity(document));
            }

            let matches = results.filter(function(card) {
                return card.Name.toLowerCase() === terms || (!['Hero', 'Alter-Ego'].includes(card.Type) && card.Subname != null && card.Subname.toLowerCase() === terms) || card.Id.toLowerCase() === terms;
            });

            return TrimDuplicates(matches.length > 0 ? matches : results);
        }
    }

    static async RetrieveByCollection(collectionEntity, type) {
        const session = this.store.openSession();

        let index = `${collectionEntity.Official ? OFFICIAL : UNOFFICIAL}${CardEntity.COLLECTION}`;

        let documents = await session.query({ indexName: index })
            .search(`${type}Ids`, collectionEntity.Id, 'OR')
            .all();

        let collection = new NavigationCollection();
        collection.tag = 'Card';

        if (documents.length > 0) {
            documents.sort((a, b) => {
                let artificialIdA = a.Printings.find(x => x[`${type}Id`] === collectionEntity.Id).ArtificialId;
                let artificialIdB = b.Printings.find(x => x[`${type}Id`] === collectionEntity.Id).ArtificialId;

                if (artificialIdA > artificialIdB) return 1;
                else if (artificialIdA < artificialIdB) return -1;
                else return 0;
            });

            let results = [];

            for (let document of documents) {
                results.push(new CardEntity(document));
            }
            
            for (let card of results) {
                collection.cards.push(card);

                let element = {
                    cardId: card.Id,
                    faces: null
                };

                let baseId = GetBaseId(card);

                if (card.Id.length != baseId.length) element.faces = results.filter(x => x.Id.includes(baseId)).map(x => x.Id);

                collection.elements.push(element);
            }
            
            collection.faces = collection.elements[0].faces ?? [];

            return collection;
        }
        else {
            return null;
        }
    }

    static async RetrieveByIdList(ids) {
        const session = this.store.openSession();
    
        let documents = await session.query({ indexName: 'allcards' })
            .whereIn('id()', ids)
            .all();
    
        if (documents.length > 0) {    
            let results = [];
    
            for (let document of documents) {
                results.push(new CardEntity(document));
            }

            return results;
        }
        else return null;
    }
}

module.exports = { CardDao }