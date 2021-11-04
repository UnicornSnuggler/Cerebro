const { GroupEntity } = require('../models/groupEntity');
const { CreateDocumentStore } = require('../utilities/documentStoreHelper');

class GroupDao {
    constructor() { }

    static store = CreateDocumentStore(GroupEntity.DATABASE).initialize();

    static GROUPS = [];

    static async RetrieveAllGroups() {
        console.log(`Starting to load groups from the database...`);
        
        this.GROUPS = [];

        for (var index of GroupEntity.INDEXES) {
            var documents = await this.store.openSession().query({ indexName: index }).all();
    
            for (var document of documents) {
                this.GROUPS.push(new GroupEntity(document));
            }

            console.log(` - Found ${documents.length} groups from index '${index}'...`);
        }

        console.log(`Loaded ${this.GROUPS.length} total groups from the database!\n`);
    }
}

module.exports = { GroupDao }