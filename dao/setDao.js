const azure = require('azure-storage');
const { SetEntity } = require('../models/setEntity');

class SetDao {
    constructor() { }

    static tableService = azure.createTableService(process.env.connectionString);
    static SETS = [];

    static RetrieveAllSets() {
        this.SETS = [];
    
        this.tableService.queryEntities(SetEntity.TABLE_NAME, new azure.TableQuery(), null, this.AddSetsCallback);
    }

    static AddSetsCallback = (error, result, response) => {
        if (!error) {
            result.entries.forEach(tableEntity => {
                this.SETS.push(new SetEntity(tableEntity));
            });
    
            if (this.SETS.length > 0) {
                console.log(`Loaded ${this.SETS.length} sets from the database!`);
            }
            else {
                console.log(`Unable to load sets from the database...`);
            }
        }
    }
};

module.exports = { SetDao };