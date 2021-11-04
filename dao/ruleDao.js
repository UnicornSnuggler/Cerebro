const { RuleEntity } = require('../models/ruleEntity');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

class RuleDao {
    constructor() { }

    static store = CreateDocumentStore(RuleEntity.DATABASE).initialize();
    
    static KEYWORDS_AND_ICONS = [];

    static async RetrieveKeywordsAndSchemeIcons() {
        console.log(`Starting to load keywords and scheme icons from the database...`);

        this.KEYWORDS_AND_ICONS = [];

        var results = await this.store.openSession().query({ indexName: RuleEntity.INDEX })
            .whereEquals('Type', 'Keyword').orElse()
            .whereEquals('Type', 'Scheme Icon')
            .orderBy('Id').all();

        for (var result of results) {
            this.KEYWORDS_AND_ICONS.push(new RuleEntity(result));
        }

        console.log(`Loaded ${this.KEYWORDS_AND_ICONS.length} keywords and scheme icons from the database!\n`);
    }

    static async RetrieveByTerm(terms) {
        const session = this.store.openSession();

        var query = terms.replace(/[^a-zA-Z0-9]/gmi, '').toLowerCase();

        var results = await session.query({ indexName: RuleEntity.INDEX })
            .whereRegex('Id', query).orElse()
            .whereRegex('Title', query).orElse()
            .whereRegex('StrippedTitle', query).orElse()
            .whereRegex('Terms', query)
            .orderBy('Id').all();

        if (results.length === 0) {
            results = await session.query({ indexName: RuleEntity.INDEX })
                .whereEquals('Id', query).fuzzy(0.70).orElse()
                .whereEquals('Title', query).fuzzy(0.70).orElse()
                .whereEquals('StrippedTitle', query).fuzzy(0.70).orElse()
                .whereEquals('Terms', query).fuzzy(0.70)
                .orderBy('Id').all();
        }

        return results.length > 0 ? results : null;
    }
}

module.exports = { RuleDao }