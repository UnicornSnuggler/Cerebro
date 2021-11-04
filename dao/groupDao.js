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
            var results = await this.store.openSession().query({ indexName: index }).all();
    
            for (var result of results) {
                this.GROUPS.push(new GroupEntity(result));
            }

            console.log(` - Found ${results.length} groups from index '${index}'...`);
        }

        console.log(`Loaded ${this.GROUPS.length} total groups from the database!`);
    }
}

module.exports = { GroupDao }