const { RuleEntity } = require('../models/ruleEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class RuleDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(RuleEntity.COLLECTION)).initialize();
    
    static KEYWORDS_AND_ICONS = [];

    static async AddQuery(rule) {
        let session = this.store.openSession();
        let ruleEntity = await session.load(rule.Id);

        ruleEntity.Queries += 1;

        await session.saveChanges();
    }

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

    static async RetrieveByTerm(terms, origin) {
        const session = this.store.openSession();

        let index = `${origin}${RuleEntity.COLLECTION}`;
        let convertedQuery = terms.normalize('NFD').replace(/[^a-z0-9 {}-]/gmi, '').toLowerCase();
        let tokenizedQuery = convertedQuery.replace(/[^a-z0-9 {}-]/gmi, '').replace(/[-]/gmi, ' ');
        let strippedQuery = convertedQuery.replace(/[^a-z0-9]/gmi, '');

        let documents = await session.query({ indexName: index })
            .search('Terms', convertedQuery, 'AND')
            .orderBy('id()').all();

        if (documents.length === 0) {
            documents = await session.query({ indexName: index })
                .whereRegex('Title', convertedQuery).orElse()
                .whereRegex('TokenizedTitle', tokenizedQuery).orElse()
                .whereRegex('StrippedTitle', strippedQuery)
                .orderBy('id()').all();

                if (documents.length === 0) {
                    documents = await session.query({ indexName: index })
                        .whereEquals('Title', convertedQuery).fuzzy(0.70).orElse()
                        .whereEquals('TokenizedTitle', tokenizedQuery).fuzzy(0.70).orElse()
                        .whereEquals('StrippedTitle', strippedQuery).fuzzy(0.70)
                        .orderBy('id()').all();
                }
        }

        let results = [];

        for (let document of documents) {
            results.push(new RuleEntity(document));
        }

        return results.length > 0 ? results : null;
    }
}

module.exports = { RuleDao }