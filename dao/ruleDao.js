const { RuleEntity } = require('../models/ruleEntity');
const { DocumentStore } = require('ravendb');

class RuleDao {
    constructor() { }

    static store = new DocumentStore([process.env.ravenUri], RuleEntity.DATABASE, {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem',
        password: ''
    }).initialize();
    
    static KEYWORDS_AND_ICONS = [];

    static async RetrieveKeywordsAndSchemeIcons()
    {
        console.log(`Starting to load keywords and scheme icons from the database...`);

        this.KEYWORDS_AND_ICONS = [];

        var results = await this.store.openSession().query({ indexName: RuleEntity.INDEX })
            .whereEquals('Type', 'Keyword').orElse()
            .whereEquals('Type', 'Scheme Icon')
            .orderBy('Id').all();

        results.forEach(result => {
            this.KEYWORDS_AND_ICONS.push(new RuleEntity(result));
        });

        console.log(`Loaded ${this.KEYWORDS_AND_ICONS.length} keywords and scheme icons from the database!\n`);
    };

    static async RetrieveByTerm(terms) {
        const session = this.store.openSession();

        var query = terms.replace(/[^a-zA-Z0-9]/gmi, '').toLowerCase();

        console.log(`Attempting to retrieve rules with query '${query}'...`);

        var results = await session.query({ indexName: RuleEntity.INDEX })
            .whereRegex('Id', query).orElse()
            .whereRegex('Title', query).orElse()
            .whereRegex('StrippedTitle', query).orElse()
            .whereRegex('Terms', query)
            .orderBy('Id').all();

        if (results.length === 0) {
            console.log(`No exact matches found... Attempting fuzzy matches...`);

            results = await session.query({ indexName: RuleEntity.INDEX })
                .whereEquals('Id', query).fuzzy(0.70).orElse()
                .whereEquals('Title', query).fuzzy(0.70).orElse()
                .whereEquals('StrippedTitle', query).fuzzy(0.70).orElse()
                .whereEquals('Terms', query).fuzzy(0.70)
                .orderBy('Id').all();
        }

        return results.length === 0 ? null : results;
    };
};

module.exports = { RuleDao };