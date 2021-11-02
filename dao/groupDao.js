const azure = require('azure-storage');
const { GroupEntity } = require('../models/groupEntity');

class GroupDao {
    constructor() { }

    static tableService = azure.createTableService(process.env.connectionString);
    static GROUPS = [];

    static RetrieveAllGroups() {
        this.GROUPS = [];
    
        this.tableService.queryEntities(GroupEntity.TABLE_NAME, new azure.TableQuery(), null, this.AddGroupsCallback);
    }

    static AddGroupsCallback = (error, result, response) => {
        if (!error) {
            result.entries.forEach(tableEntity => {
                this.GROUPS.push(new GroupEntity(tableEntity));
            });
    
            if (this.GROUPS.length > 0) {
                console.log(`Loaded ${this.GROUPS.length} groups from the database!`);
            }
            else {
                console.log(`Unable to load groups from the database...`);
            }
        }
    }
};

module.exports = { GroupDao };