const { GroupEntity } = require('../models/groupEntity');
const { CreateDocumentStore, DeriveDatabase } = require('../utilities/documentStoreHelper');

class GroupDao {
    constructor() { }

    static store = CreateDocumentStore(DeriveDatabase(GroupEntity.DATABASE_SUFFIX)).initialize();

    static GROUPS = [];

    static async RetrieveAllGroups() {
        console.log(`Starting to load groups from the database...`);
        
        this.GROUPS = [];

        let documents = await this.store.openSession().query({ indexName: `all${GroupEntity.COLLECTION}` }).all();

        for (let document of documents) {
            this.GROUPS.push(new GroupEntity(document));
        }

        console.log(` - Found ${this.GROUPS.filter(x => x.Official).length} official groups in the database...`);
        console.log(` - Found ${this.GROUPS.filter(x => !x.Official).length} unofficial groups in the database...`);
        console.log(`Loaded ${this.GROUPS.length} total groups from the database!\n`);
    }
}

module.exports = { GroupDao }