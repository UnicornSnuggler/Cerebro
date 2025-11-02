require('dotenv').config()

const { CardEntity } = require('./models/cardEntity');
const { RuleEntity } = require('./models/ruleEntity');
const { CreateDocumentStore, DeriveDatabase } = require('./utilities/documentStoreHelper');
const { ALL } = require('./constants');

const store = CreateDocumentStore(DeriveDatabase(RuleEntity.DATABASE_SUFFIX)).initialize();

// async function execute() {
//     let session = store.openSession();
//     let cardEntities = await session.query({ indexName: `${ALL}${CardEntity.COLLECTION}` }).all();
    
//     for (card of cardEntities) {
//         if (!card.Queries || card.Queries == null) {
//             card.Queries = 0;
//         }
//     }
    
//     await session.saveChanges();
// }

let funkyApostrophe = '’';

async function execute() {
    let session = store.openSession();
    let ruleEntities = await session.query({ indexName: `${ALL}${RuleEntity.COLLECTION}` }).all();
    
    let count = 0;

    for (rule of ruleEntities) {
        if (!rule.Queries || rule.Queries == null) {
            rule.Queries = 0;
            count++;
        }
    }

    await session.saveChanges();
    
    console.log(`Done! ${count} entries modified...`);
}

console.log(`Executing...`);

execute();