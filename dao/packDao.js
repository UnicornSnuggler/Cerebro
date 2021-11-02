const azure = require('azure-storage');
const { PackEntity } = require('../models/packEntity');

class PackDao {
    constructor() { }

    static tableService = azure.createTableService(process.env.connectionString);
    static PACKS = [];

    static RetrieveAllPacks() {
        this.PACKS = [];
    
        this.tableService.queryEntities(PackEntity.TABLE_NAME, new azure.TableQuery(), null, this.AddPacksCallback);
    }

    static AddPacksCallback = (error, result, response) => {
        if (!error) {
            result.entries.forEach(tableEntity => {
                this.PACKS.push(new PackEntity(tableEntity));
            });
    
            if (this.PACKS.length > 0) {
                console.log(`Loaded ${this.PACKS.length} packs from the database!`);
            }
            else {
                console.log(`Unable to load packs from the database...`);
            }
        }
    }
};

module.exports = { PackDao };