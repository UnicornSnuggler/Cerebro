const { RuleEntity } = require('../models/ruleEntity');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

class RuleDao {
    constructor() { }

    static store = CreateDocumentStore(RuleEntity.DATABASE).initialize();
    
    static KEYWORDS_AND_ICONS = [];

    static async RetrieveKeywordsAndSchemeIcons() {
        console.log(`Starting to load keywords and scheme icons from the database...`);

        this.KEYWORDS_AND_ICONS = [];

        var documents = await this.store.openSession().query({ indexName: RuleEntity.INDEX })
            .whereEquals('Type', 'Keyword').orElse()
            .whereEquals('Type', 'Scheme Icon')
            .orderBy('id()').all();

        for (var document of documents) {
            this.KEYWORDS_AND_ICONS.push(new RuleEntity(document));
        }

        console.log(`Loaded ${this.KEYWORDS_AND_ICONS.length} keywords and scheme icons from the database!\n`);
    }

    static async RetrieveByTerm(terms) {
        const session = this.store.openSession();

        var query = terms.replace(/[^a-zA-Z0-9]/gmi, '').toLowerCase();

        var documents = await session.query({ indexName: RuleEntity.INDEX })
            .whereRegex('id()', query).orElse()
            .whereRegex('Title', query).orElse()
            .whereRegex('StrippedTitle', query).orElse()
            .whereRegex('Terms', query)
            .orderBy('id()').all();

        if (documents.length === 0) {
            documents = await session.query({ indexName: RuleEntity.INDEX })
                .whereEquals('id()', query).fuzzy(0.70).orElse()
                .whereEquals('Title', query).fuzzy(0.70).orElse()
                .whereEquals('StrippedTitle', query).fuzzy(0.70).orElse()
                .whereEquals('Terms', query).fuzzy(0.70)
                .orderBy('id()').all();
        }

        var results = [];

        for (var document of documents) {
            results.push(new RuleEntity(document));
        }

        return results.length > 0 ? results : null;
    }
}

module.exports = { RuleDao }