const { GroupDao } = require('./groupDao');
const { CardEntity } = require('../models/cardEntity');
const { NavigationCollection } = require('../models/navigationCollection');
const { GetBaseId, ShareFaces, ShareGroups, BuildCollectionFromBatch, IsCampaignCard } = require('../utilities/cardHelper');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');
const { OFFICIAL, ALL, FILTERS } = require('../constants');
const { EscapeRegex } = require('../utilities/stringHelper');
const { SetDao } = require('./setDao');

// Deprecated, but retaining for historical reference
const TrimDuplicates = function(cards) {
    let results = [];

    cards.sort((a, b) => {
        let compare = a.Name.localeCompare(b.Name);

        if (compare != 0) return compare;
        else {
            compare = a.Subname && b.Subname ? a.Subname.localeCompare(b.Subname) : 0;
            
            if (compare != 0) return compare;
            else return a.Id.localeCompare(b.Id);
        }
    });

    for (let card of cards) {
        if (!results.some(x => ((!['Hero', 'Alter-Ego'].includes(x.Type) || x.Subname) && ShareFaces(card, x)) || ShareGroups(card, x))) {
            results.push(card);
        }
    }

    return results;
}

class CardDao {
    constructor() {}

    static store = CreateDocumentStore(DeriveDatabase(CardEntity.DATABASE_SUFFIX)).initialize();

    static async AddQuery(card) {
        let session = this.store.openSession();
        let cardEntity = await session.load(card.Id);

        cardEntity.Queries += 1;

        await session.saveChanges();
    }

    static async FindFaces(card) {
        let baseId = GetBaseId(card);

        if (card.Id.length === baseId.length) return null;

        let index = `${ALL}${CardEntity.COLLECTION}`;

        let results = [];

        let documents = await this.store.openSession().query({ indexName: index })
            .whereEquals('Official', card.Official)
            .andAlso()
            .whereRegex('id()', baseId)
            .orderBy('id()').all();

        for (let document of documents) {
            results.push(new CardEntity(document));
        }

        return results.length > 1 ? results : null;
    }

    static async FindElements(card) {
        if (!card.GroupId) return null;

        let index = `${ALL}${CardEntity.COLLECTION}`;

        let results = [];

        let documents = await this.store.openSession().query({ indexName: index })
            .whereEquals('Official', card.Official)
            .andAlso()
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

    static async RetrieveByName(terms, origin) {
        const session = this.store.openSession();

        terms = terms.toLowerCase();

        let wildcard = terms.includes('*');

        let index = `${ALL}${CardEntity.COLLECTION}`;
        let convertedQuery = terms.normalize('NFD').replace(/[\u0300-\u036f]/gmi, '').toLowerCase();
        let tokenizedQuery = convertedQuery.replace(/[^a-z0-9 -]/gmi, '').replace(/[-]/gmi, ' ');
        let strippedQuery = convertedQuery.replace(/[^a-z0-9]/gmi, '');
        
        let query;
        let documents = [];

        if (!wildcard) {
            query = session.query({ indexName: index });

            if (origin !== ALL) query.whereEquals('Official', origin === OFFICIAL).andAlso();

            query = query.openSubclause()
                .search('id()', convertedQuery, 'AND').orElse()
                .search('Name', convertedQuery, 'AND').orElse()
                .search('TokenizedName', tokenizedQuery, 'AND').orElse()
                .search('StrippedName', strippedQuery, 'AND').orElse()
                .search('Subname', convertedQuery, 'AND').orElse()
                .search('TokenizedSubname', tokenizedQuery, 'AND').orElse()
                .search('StrippedSubname', strippedQuery, 'AND')
                .closeSubclause();

            documents = await query.all();
        }

        if (documents.length === 0 && !wildcard) {
            query = session.query({ indexName: index });

            if (origin !== ALL) query.whereEquals('Official', origin === OFFICIAL).andAlso();

            query = query.openSubclause()
                .whereLucene('TokenizedName', tokenizedQuery).orElse()
                .whereLucene('StrippedName', strippedQuery).orElse()
                .whereLucene('TokenizedSubname', tokenizedQuery).orElse()
                .whereLucene('StrippedSubname', strippedQuery)
                .closeSubclause();

            documents = await query.all();
        }
        
        if (documents.length === 0) {
            query = session.query({ indexName: index });

            if (origin !== ALL) query.whereEquals('Official', origin === OFFICIAL).andAlso();

            query = query.openSubclause()
                .whereRegex('TokenizedName', tokenizedQuery).orElse()
                .whereRegex('StrippedName', strippedQuery).orElse()
                .whereRegex('TokenizedSubname', tokenizedQuery).orElse()
                .whereRegex('StrippedSubname', strippedQuery)
                .closeSubclause();

            documents = await query.all();
        }

        if (documents.length === 0) {
            query = session.query({ indexName: index });

            if (origin !== ALL) query.whereEquals('Official', origin === OFFICIAL).andAlso();

            query = query.openSubclause()
                .whereEquals('Name', convertedQuery).fuzzy(0.70).orElse()
                .whereEquals('TokenizedName', tokenizedQuery).fuzzy(0.70).orElse()
                .whereEquals('StrippedName', strippedQuery).fuzzy(0.70).orElse()
                .whereEquals('Subname', convertedQuery).fuzzy(0.70).orElse()
                .whereEquals('TokenizedSubname', tokenizedQuery).fuzzy(0.70).orElse()
                .whereEquals('StrippedSubname', strippedQuery).fuzzy(0.70)
                .closeSubclause();

            documents = await query.all();
        }

        if (documents.length > 0) {
            let results = [];

            for (let document of documents) {
                results.push(new CardEntity(document));
            }

            results.sort(function(a, b) {
                return a.Id - b.Id;
            });

            let matches = results.filter(function(card) {
                return card.Name.toLowerCase() === terms || (card.Subname != null && card.Subname.toLowerCase() === terms) || card.Id.toLowerCase() === terms;
            });

            return matches.length > 0 && !wildcard ? matches : results;
        }

        return [];
    }

    static async RetrieveByCollection(collectionEntity, type) {
        const session = this.store.openSession();

        let documents = await session.query({ indexName: `${ALL}${CardEntity.COLLECTION}` })
            .whereEquals('Official', collectionEntity.Official)
            .andAlso()
            .search(`${type}Ids`, collectionEntity.Id, 'OR')
            .all();

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
            
            return BuildCollectionFromBatch(results);
        }
        else {
            return null;
        }
    }

    static async RetrieveByIdList(ids) {
        const session = this.store.openSession();
    
        let documents = await session.query({ indexName: `${ALL}${CardEntity.COLLECTION}` })
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

    static async RetrieveRandomCard(encounter = false, classifications = null, omitIdentityLocking = false) {
        const session = this.store.openSession();

        let query = session.query({ indexName: `${ALL}${CardEntity.COLLECTION}` })
            .whereEquals('Official', true)
            .andAlso()
            .whereEquals('Incomplete', false)
            .andAlso()
            .not()
            .whereIn('SetIds', SetDao.CAMPAIGN_SET_IDS)
            .andAlso();
        
        if (encounter) {
            query = query.whereEquals('Classification', 'Encounter');
        }
        else if (classifications) {
            query = query.whereIn('Classification', classifications);
        }
        else {
            query = query.whereNotEquals('Classification', 'Encounter');
        }

        if (omitIdentityLocking) {
            query = query.andAlso()
                .not()
                .whereRegex('Rules', 'Play only if your identity has');
        }

        let documents = await query.randomOrdering()
            .take(1)
            .all();

        return new CardEntity(documents[0]);
    }

    static async RetrieveWithFilters(origin, author, boost, classification, cost, excludeCampaign, incomplete, pack, resource, set, text, traits, type) {
        const session = this.store.openSession();
        let query = session.query({ indexName: `${ALL}${CardEntity.COLLECTION}` });

        if (origin !== ALL) {            
            query = query.whereEquals('Official', origin === OFFICIAL);
        }

        if (classification) {
            if (classification === 'aspect') {
                query = query.openSubclause()
                    .not()
                    .whereRegex('Classification', 'encounter')
                    .andAlso()
                    .not()
                    .whereRegex('Classification', 'hero')
                    .closeSubclause();
            }
            else if (classification === 'player') {
                query = query.openSubclause()
                    .not()
                    .whereRegex('Classification', 'encounter')
                    .closeSubclause();
            }
            else {
                query = query.openSubclause()
                    .whereRegex('Classification', classification)
                    .closeSubclause();
            }
        }

        if (author) {
            query = query.openSubclause()
                .whereRegex('AuthorId', author)
                .closeSubclause();
        }

        if (boost) {
            query = query.openSubclause()
                .whereRegex('Boost', boost)
                .closeSubclause();
        }

        if (cost) {
            query = query.openSubclause()
                .whereRegex('Cost', cost)
                .closeSubclause();
        }

        if (incomplete) {
            query = query.openSubclause()
                .whereEquals('Incomplete', incomplete)
                .closeSubclause();
        }

        if (pack) {
            query = query.openSubclause();

            for (let packId of pack) {
                if (pack.indexOf(packId) === 0) {
                    query = query.whereEquals('PackIds', packId);
                }
                else {
                    query = query.orElse()
                        .whereEquals('PackIds', packId);
                }
            }

            query = query.closeSubclause();
        }

        if (resource) {
            if (resource === 'none') {
                query = query.openSubclause()
                    .negateNext()
                    .whereExists('Resource')
                    .closeSubclause();
            }
            else {
                query = query.openSubclause()
                    .whereRegex('Resource', resource)
                    .closeSubclause();
            }
        }

        if (set) {
            query = query.openSubclause();

            for (let setId of set) {
                if (set.indexOf(setId) === 0) {
                    query = query.whereEquals('SetIds', setId);
                }
                else {
                    query = query.orElse()
                        .whereEquals('SetIds', setId);
                }
            }

            query = query.closeSubclause();
        }

        if (text) {
            let escapedTerms = EscapeRegex(text);

            query = query.openSubclause()
                .whereRegex('Rules', escapedTerms)
                .orElse().whereRegex('Special', escapedTerms)
                .closeSubclause();
        }

        if (traits) {
            query = query.openSubclause();

            for (let term of traits) {
                let escapedTerm = EscapeRegex(term);
                
                if (term === traits[0]) {
                    query = query.whereRegex('Traits', escapedTerm);
                }
                else {
                    query = query.andAlso().whereRegex('Traits', escapedTerm);
                }
            }

            query = query.closeSubclause();
        }

        if (type) {
            query = query.openSubclause()
                .whereRegex('Type', type)
                .closeSubclause();
        }
    
        let documents = await query.all();
    
        if (documents.length > 0) {
            let results = [];
    
            for (let document of documents) {
                let newCard = new CardEntity(document);
                
                if (!excludeCampaign || !IsCampaignCard(newCard)) results.push(newCard);
            }

            results.sort(function(a, b) {
                return a.Id - b.Id;
            });

            return results;
        }
        else return [];
    }

    static async RetrieveWithAdvancedQueryLanguage(input) {
        const session = this.store.openSession();
        let query = session.query({ indexName: `${ALL}${CardEntity.COLLECTION}` });

        let replacements = {};

        let convertedInput = input.toLowerCase().replaceAll(/(?<property>[a-z]+?):((?<!(?<!\\)\\)\"(?<query>.*?)(?<!(?<!\\)\\)\")/gmi, function(match, property, query) {
            let key = `{${Object.keys(replacements).length}}`;
            let convertedProperty = FILTERS.find(x => x.verbose === property || x.shorthand === property);
            let formattedQuery = query.replaceAll(/(?<!(?<!\\)\\)\"/gmi, '');
            
            replacements[key] = {
                property: convertedProperty.property,
                query: formattedQuery
            };
    
            return key;
        });

        for (let index = 0; index < convertedInput.length; index++) {
            if (convertedInput[index] === '(') {
                query = query.openSubclause(); 
            }
            else if (convertedInput[index] === ')') {
                query = query.closeSubclause();
            }
            else if (convertedInput[index] === '&') {
                query = query.andAlso();
            }
            else if (convertedInput[index] === '|') {
                query = query.orElse();
            }
            else if (convertedInput[index] === '-') {
                query = query.not();
            }
            else {
                let endingIndex = convertedInput.indexOf('}', index);
                let designation = convertedInput.substring(index, endingIndex + 1);
                let entry = replacements[designation];

                index = endingIndex;

                if (!['PackIds', 'SetIds'].includes(entry.property)) {
                    query = query.whereRegex(entry.property, entry.query);
                }
                else {
                    query = query.whereEquals(entry.property, entry.query);
                }
            }
        }

        let documents = await query.all();
    
        if (documents.length > 0) {    
            let results = [];
    
            for (let document of documents) {
                results.push(new CardEntity(document));
            }

            results.sort(function(a, b) {
                return a.Id - b.Id;
            });

            return results;
        }
        else return [];
    }
}


module.exports = { CardDao }