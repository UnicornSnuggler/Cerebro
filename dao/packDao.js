const { DocumentStore } = require('ravendb');
const { PackEntity } = require('../models/packEntity');

class PackDao {
    constructor() { }

    static store = new DocumentStore([process.env.ravenUri], PackEntity.DATABASE, {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem',
        password: ''
    }).initialize();

    static PACKS = [];

    static async RetrieveAllPacks() {
        console.log(`Starting to load packs from the database...`);
        
        this.PACKS = [];

        for (var index of PackEntity.INDEXES) {
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            results.forEach(result => {
                this.PACKS.push(new PackEntity(result));
            });

            console.log(` - Found ${results.length} packs from index '${index}'...`);
        }

        console.log(`Loaded ${this.PACKS.length} total packs from the database!\n`);
    }
};

module.exports = { PackDao };