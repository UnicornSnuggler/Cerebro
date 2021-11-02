const azure = require('azure-storage');
const { FormattingEntity } = require('../models/formattingEntity');

class FormattingDao {
    constructor() { }

    static tableService = azure.createTableService(process.env.connectionString);
    static FORMATTINGS = [];

    static RetrieveAllFormattings() {
        this.FORMATTINGS = [];
    
        this.tableService.queryEntities(FormattingEntity.TABLE_NAME, new azure.TableQuery(), null, this.AddFormattingsCallback);
    }

    static AddFormattingsCallback = (error, result, response) => {
        if (!error) {
            result.entries.forEach(tableEntity => {
                this.FORMATTINGS.push(new FormattingEntity(tableEntity));
            });
    
            if (this.FORMATTINGS.length > 0) {
                console.log(`Loaded ${this.FORMATTINGS.length} formattings from the database!`);
            }
            else {
                console.log(`Unable to load formattings from the database...`);
            }
        }
    }
};

module.exports = { FormattingDao };