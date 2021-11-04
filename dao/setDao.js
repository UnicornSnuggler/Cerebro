const { DocumentStore } = require('ravendb');
const { SetEntity } = require('../models/setEntity');

class SetDao {
    constructor() { }

    static store = new DocumentStore([process.env.ravenUri], SetEntity.DATABASE, {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem',
        password: ''
    }).initialize();

    static SETS = [];

    static async RetrieveAllSets() {
        console.log(`Starting to load sets from the database...`);
        
        this.SETS = [];

        for (var index of SetEntity.INDEXES) {
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            results.forEach(result => {
                this.SETS.push(new SetEntity(result));
            });

            console.log(` - Found ${results.length} sets from index '${index}'...`);
        }

        console.log(`Loaded ${this.SETS.length} total sets from the database!\n`);
    }
};

module.exports = { SetDao };