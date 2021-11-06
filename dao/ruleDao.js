const { RuleEntity } = require('../models/ruleEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');
const { OFFICIAL, UNOFFICIAL } = require('../constants');

class RuleDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(RuleEntity.COLLECTION)).initialize();
    
    static KEYWORDS_AND_ICONS = [];

    static async RetrieveKeywordsAndSchemeIcons() {
        console.log(`Starting to load keywords and scheme icons from the database...`);

        this.KEYWORDS_AND_ICONS = [];

        let documents = await this.store.openSession().query({ indexName: `all${RuleEntity.COLLECTION}` })
            .whereEquals('Type', 'Keyword').orElse()
            .whereEquals('Type', 'Scheme Icon')
            .orderBy('id()').all();

        for (let document of documents) {
            this.KEYWORDS_AND_ICONS.push(new RuleEntity(document));
        }

        console.log(` - Found ${this.KEYWORDS_AND_ICONS.filter(x => x.Official).length} official keywords and scheme icons in the database...`);
        console.log(` - Found ${this.KEYWORDS_AND_ICONS.filter(x => !x.Official).length} unofficial keywords and scheme icons in the database...`);
        console.log(`Loaded ${this.KEYWORDS_AND_ICONS.length} keywords and scheme icons from the database!\n`);
    }

    static async RetrieveByTerm(terms, official) {
        const session = this.store.openSession();

        let index = `${official ? OFFICIAL : UNOFFICIAL}${RuleEntity.COLLECTION}`;
        let query = terms.normalize('NFD').replace(/[^a-z0-9]/gmi, '').toLowerCase();

        let documents = await session.query({ indexName: index })
            .whereRegex('id()', query).orElse()
            .whereRegex('Title', query).orElse()
            .whereRegex('StrippedTitle', query).orElse()
            .whereRegex('Terms', query)
            .orderBy('id()').all();

        if (documents.length === 0) {
            documents = await session.query({ indexName: index })
                .whereEquals('id()', query).fuzzy(0.70).orElse()
                .whereEquals('Title', query).fuzzy(0.70).orElse()
                .whereEquals('StrippedTitle', query).fuzzy(0.70).orElse()
                .whereEquals('Terms', query).fuzzy(0.70)
                .orderBy('id()').all();
        }

        let results = [];

        for (let document of documents) {
            results.push(new RuleEntity(document));
        }

        return results.length > 0 ? results : null;
    }
}

module.exports = { RuleDao }