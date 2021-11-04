const { DocumentStore } = require('ravendb');
const { FormattingEntity } = require('../models/formattingEntity');

class FormattingDao {
    constructor() { }

    static store = new DocumentStore([process.env.ravenUri], FormattingEntity.DATABASE, {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem',
        password: ''
    }).initialize();

    static FORMATTINGS = [];

    static async RetrieveAllFormattings() {
        console.log(`Starting to load formattings from the database...`);
        
        this.FORMATTINGS = [];

        for (var index of FormattingEntity.INDEXES) {
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            results.forEach(result => {
                this.FORMATTINGS.push(new FormattingEntity(result));
            });

            console.log(` - Found ${results.length} formattings from index '${index}'...`);
        }

        console.log(`Loaded ${this.FORMATTINGS.length} total formattings from the database!\n`);
    }
};

module.exports = { FormattingDao };