const { SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const { ID_LENGTH } = require('../constants');
const { PrintingDao } = require('./printingDao');
const { CardEntity } = require('../models/cardEntity');
const { GetBaseId, ShareFaces, ShareGroups } = require('../utilities/cardHelper');
const { BuildWildcardQuery, EscapeQuery, FlagNames } = require('../utilities/queryHelper');

const TrimDuplicates = function(cards)
{
    var results = [];

    cards.forEach(card => {
        if (results.find(x => ShareFaces(card, x) || ShareGroups(card, x)) == null)
        {
            results.push(card);
        }  
    });

    return results;
};

class CardDao {
    constructor() { }
    
    static searchClient = new SearchIndexClient(process.env.searchUri, new AzureKeyCredential(process.env.apiKey)).getSearchClient(CardEntity.INDEX_NAME);

    static async FindFaces(card) {
        if (card.Id.length === ID_LENGTH) return null;

        var searchOptions = {
            queryType: 'full',
            searchFields: ['RowKey'],
            searchMode: 'all'
        };
        
        var searchResults = await this.searchClient.search(`${GetBaseId(card)}*`, searchOptions);

        var results = [];

        for await (const result of searchResults.results) {
            var card = new CardEntity(result.document);

            results.push(card);
        }

        return results.length > 1 ? results : null;
    };

    static async FindStages(card) {
        if (!card.Group) return null;

        var searchOptions = {
            filter: `Group eq '${card.Group}'`
        };
        
        var searchResults = await this.searchClient.search('*', searchOptions);

        var results = [];

        for await (const result of searchResults.results) {
            var card = new CardEntity(result.document);

            results.push(card);
        }

        return results.length > 1 ? results : null;
    };

    static async FindFacesAndStages(card) {
        var collection = {
            cards: [],
            faces: [],
            stages: []
        }

        if (card.Type === 'Villain' || card.Type === 'Main Scheme') {
            var stages = await this.FindStages(card);
            
            if (stages != null) {
                for (var stage of stages) {
                    collection.cards.push(await this.GetPrintings(stage));

                    var stageEntry = {
                        cardId: stage.Id,
                        faces: null
                    };

                    if (stage.Id.length > ID_LENGTH) {
                        var faces = stages.filter(x => x.Id.includes(GetBaseId(stage))).map(x => x.Id);

                        stageEntry.faces = faces;
                    }

                    collection.stages.push(stageEntry);
                };
                
                var currentStage = collection.stages.find(x => x.cardId === card.Id);
                if (currentStage.faces != null) collection.faces = currentStage.faces;

                return collection;
            }
            else {
                var faces = await this.FindFaces(card);

                if (faces != null) {
                    for (var face of faces) {
                        collection.cards.push(await this.GetPrintings(face));
    
                        collection.faces.push(face.Id);
                    };

                    return collection;
                }
            }
        }
        else {
            var faces = await this.FindFaces(card);

            if (faces != null) {
                for (var face of faces) {
                    collection.cards.push(await this.GetPrintings(face));

                    collection.faces.push(face.Id);
                };

                return collection;
            }
        }

        collection.cards.push(await this.GetPrintings(card));
        
        return collection;
    }

    static async GetPrintings(card) {
        card.Printings = await PrintingDao.RetrieveByCard(card);

        var arts = [card.Id];

        card.Printings.forEach(printing =>
        {
            if (printing.AlternateArt)
            {
                arts.push(printing.CardId);
            }
        });

        card.ArtStyles = arts;

        return card;
    };

    static async RetrieveByName(terms, flag = null) {
        terms = terms.toLowerCase();

        if (flag === null) {
            flag = terms.includes('*') ? FlagNames.WILDCARD : FlagNames.BARE;
        }

        var searchOptions = {
            queryType: 'full',
            searchFields: ['Name, Subname, RowKey'],
            searchMode: 'all'
        };

        var query;

        switch(flag) {
            case FlagNames.WILDCARD:
                query = BuildWildcardQuery(terms);
                break;
            case FlagNames.FUZZY:
                query = EscapeQuery(terms).split(' ').map(x => `${x}~`).join(' ');
                break;
            default:
                query = EscapeQuery(terms);
        }
        
        var searchResults = await this.searchClient.search(query, searchOptions);

        var results = [];

        for await (const result of searchResults.results) {
            results.push(new CardEntity(result.document));
        }

        if (results.length > 0) {
            var matches = results.filter(function(card) {
                return card.Name.toLowerCase() === terms || (card.Subname != null && card.Subname.toLowerCase() === terms) || card.Id.toLowerCase() === terms;
            });

            return TrimDuplicates(matches.length > 0 ? matches : results);
        }
        else {
            if (flag === FlagNames.FUZZY) {
                return null;
            }
            else {
                var nextFlag = flag === FlagNames.BARE ? FlagNames.WILDCARD : FlagNames.FUZZY;

                return this.RetrieveByName(terms, nextFlag);
            }
        }
    };
};

module.exports = { CardDao };