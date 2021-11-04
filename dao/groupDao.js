const { DocumentStore } = require('ravendb');
const { GroupEntity } = require('../models/groupEntity');

class GroupDao {
    constructor() { }

    static store = new DocumentStore([process.env.ravenUri], GroupEntity.DATABASE, {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem',
        password: ''
    }).initialize();

    static GROUPS = [];

    static async RetrieveAllGroups() {
        console.log(`Starting to load groups from the database...`);
        
        this.GROUPS = [];

        for (var index of GroupEntity.INDEXES) {
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            results.forEach(result => {
                this.GROUPS.push(new GroupEntity(result));
            });

            console.log(` - Found ${results.length} groups from index '${index}'...`);
        }

        console.log(`Loaded ${this.GROUPS.length} total groups from the database!\n`);
    }
};

module.exports = { GroupDao };