const { CardDao } = require('./dao/cardDao');
const { PackDao } = require('./dao/packDao');
const { SetDao } = require('./dao/setDao');
const { UserDao } = require('./dao/userDao');
const { OFFICIAL, ALL, UNOFFICIAL, FALSE, TRUE, UNAUTHORIZED_APOLOGY, VALIDATION_APOLOGY, VALIDATION_ERRORS, DUPLICATE_CODE, DUPLICATE_APOLOGY, VALIDATION_CODE, STATUS_CODES, ERROR_MESSAGES, BAD_ID_APOLOGY, ID_NOT_FOUND_APOLOGY, USER_NOT_FOUND_APOLOGY, INVALID_PASSWORD_APOLOGY } = require('./constants');
const { ArtistDao } = require('./dao/artistDao');
const { FormattingDao } = require('./dao/formattingDao');
const { ValidateQuerySyntax } = require('./utilities/queryHelper');

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { UserEntity } = require('./models/userEntity');
const { ObjectId } = require('mongodb/lib/bson');
const { DeckEntity } = require('./models/deckEntity');
const { DeckDao } = require('./dao/deckDao');
const { IsCampaignCard } = require('./utilities/cardHelper');

const app = express();

app.use(cors());
app.use(express.json());

// Support functions

function DefaultHeaders(res) {
    res.setHeader('Content-Type', 'application/json')
        .setHeader('Access-Control-Allow-Origin', '*');
}

function EvaluateValidationError(validationErrors, property, parent, root) {
    if (property.operatorName == 'properties') {
        property.propertiesNotSatisfied.forEach(subProperty => {
            subProperty.details.forEach(detail => {
                validationErrors = EvaluateValidationError(validationErrors, detail, subProperty, `${root ? `${root}.` : ''}${subProperty.propertyName}`);
            });
        });
    }
    else if (property.operatorName == 'required') {
        property.missingProperties.forEach(subProperty => {
            validationErrors.push(`'${root ? `${root}.` : ''}${subProperty}' is required...`);
        });
    }
    else if (property.operatorName == 'items') {
        property.details.forEach(detail => {
            validationErrors = EvaluateValidationError(validationErrors, detail, property, `${root ? `${root}.` : ''}item`);
        });
    }
    else if (property.operatorName == 'bsonType') {
        validationErrors.push(`'${root}' ${parent.description}...`);
    }
    else if (property.operatorName == 'minItems') {
        validationErrors.push(`'${root}' array requires at least ${property.specifiedAs.minItems} item(s)...`);
    }
    else if (property.operatorName == 'minimum') {
        validationErrors.push(`'${root}' must be equal to ${property.specifiedAs.minimum} or greater...`);
    }

    return validationErrors;
}

function FormatValidationErrors(rules) {
    let validationErrors = [];

    rules.forEach(rule => {
        validationErrors = EvaluateValidationError(validationErrors, rule, null, null);
    });
    
    return validationErrors;
};

function RetrieveQueryParameter(req, parameter, lowercase = true) {
    if (!req.query.hasOwnProperty(parameter)) {
        return null;
    }
    
    let input = req.query[parameter];

    if (Array.isArray(input)) {
        input = input[0];
    }

    return lowercase ? input.toLowerCase() : input;
}

async function ValidateToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.substring(7, authHeader.length);
    
    try {
        const request = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return request.data.id.toString() == process.env.githubUserId;
    }
    catch (error) {
        return false;
    }
};

// RavenDB endpoints

app.get('/artists', async function(req, res) {
    DefaultHeaders(res);
    
    let id = RetrieveQueryParameter(req, 'id');
    let name = RetrieveQueryParameter(req, 'name');

    let results = await ArtistDao.RetrieveWithFilters(id, name);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.end(JSON.stringify(results));
});

app.get('/cards', async function(req, res) {
    DefaultHeaders(res);
    
    let results = [];
    
    let origin = RetrieveQueryParameter(req, 'origin') || ALL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }
    
    let incomplete = RetrieveQueryParameter(req, 'incomplete');

    if (incomplete && ![FALSE, TRUE].includes(incomplete)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'incomplete' parameter must be '${FALSE}' or '${TRUE}'...` }));

        return;
    }

    let author = RetrieveQueryParameter(req, 'author', false);
    let boost = RetrieveQueryParameter(req, 'boost', false);
    let classification = RetrieveQueryParameter(req, 'classification');
    let cost = RetrieveQueryParameter(req, 'cost', false);
    let excludeCampaign = RetrieveQueryParameter(req, 'excludeCampaign');

    if (excludeCampaign) {
        await SetDao.RetrieveAllSets();
    }

    let name = RetrieveQueryParameter(req, 'name');
    let resource = RetrieveQueryParameter(req, 'resource');
    let text = RetrieveQueryParameter(req, 'text');
    let traits = RetrieveQueryParameter(req, 'traits', false)?.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, ''));
    let type = RetrieveQueryParameter(req, 'type');

    let packOption = RetrieveQueryParameter(req, 'pack');
    let packIds = null;
    
    if (packOption) {
        let packs = await PackDao.RetrieveWithFilters(origin, null, packOption);
        packs = packs.concat(await PackDao.RetrieveWithFilters(origin, packOption, null));
        
        packIds = packs.map(x => x.Id);
    }
    
    let setOption = RetrieveQueryParameter(req, 'set');
    let setIds = null;
    
    if (setOption) {
        let sets = await SetDao.RetrieveWithFilters(origin, { id: setOption });
        sets = sets.concat(await SetDao.RetrieveWithFilters(origin, { name: setOption }));
        
        setIds = sets.map(x => x.Id);
    }

    if ((!packOption || packIds.length > 0) && (!setOption || setIds.length > 0)) {
        if (name && name.match(/([a-z0-9])/gi)) {
            results = await CardDao.RetrieveByName(name, origin, false);
    
            if (results) {
                if (author) results = results.filter(card => card.AuthorId === author);
                if (boost) results = results.filter(card => card.Boost && card.Boost.toLowerCase() === boost);
                if (classification) {
                    if (classification === 'player') {
                        results = results.filter(card => card.Classification.toLowerCase() !== 'encounter');
                    }
                    else {
                        results = results.filter(card => card.Classification.toLowerCase() === classification);
                    }
                }
                if (cost) results = results.filter(card => card.Cost && card.Cost.toLowerCase() === cost);
                if (excludeCampaign) results = results.filter(card => !IsCampaignCard(card, true));
                if (incomplete) results = results.filter(card => card.Incomplete === (incomplete === 'true'));
                if (packIds) results = results.filter(card => card.Printings.some(printing => packIds.includes(printing.PackId)));
                if (resource) {
                    if (resource === 'none') {
                        results = results.filter(card => !card.Resource);
                    }
                    else {
                        results = results.filter(card => card.Resource && card.Resource.toLowerCase().includes(resource));
                    }
                }
                if (setIds) results = results.filter(card => card.Printings.some(printing => setIds.includes(printing.SetId)));
                if (text) results = results.filter(card => (card.Rules && card.Rules.toLowerCase().includes(text)) || (card.Special && card.Special.toLowerCase().includes(text)));
                if (traits) results = results.filter(card => card.Traits && traits.every(element => card.Traits.find(trait => trait.toLowerCase() === element.trim())));
                if (type) results = results.filter(card => card.Type.toLowerCase() === type);
            }
        }
        else {
            results = await CardDao.RetrieveWithFilters(origin, author, boost, classification, cost, excludeCampaign, incomplete, packIds, resource, setIds, text, traits, type, false);
        }
    }

    results.sort(function(a, b) {
        return a.Id - b.Id;
    });

    res.end(JSON.stringify(results));
});

app.get('/formattings', async function(req, res) {
    DefaultHeaders(res);
    
    let results = await FormattingDao.RetrieveWithFilters();

    results.sort(function(a, b) {
        let priorities = ['Severe', 'Exclusion', 'High', 'Medium', 'Low'];
        
        return priorities.indexOf(a.Priority) - priorities.indexOf(b.Priority);
    });

    res.end(JSON.stringify(results));
});

app.get('/packs', async function(req, res) {
    DefaultHeaders(res);

    let origin = RetrieveQueryParameter(req, 'origin') || OFFICIAL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }
    
    let incomplete = RetrieveQueryParameter(req, 'incomplete');

    if (incomplete && ![FALSE, TRUE].includes(incomplete)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'incomplete' parameter must be '${FALSE}' or '${TRUE}'...` }));

        return;
    }

    let id = RetrieveQueryParameter(req, 'id');
    let name = RetrieveQueryParameter(req, 'name');

    let results = await PackDao.RetrieveWithFilters(origin, id, incomplete, name);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.end(JSON.stringify(results));
});

app.get('/sets', async function(req, res) {
    DefaultHeaders(res);

    let origin = RetrieveQueryParameter(req, 'origin') || OFFICIAL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }

    let filters = {};

    if (req.query.hasOwnProperty('id')) filters.id = RetrieveQueryParameter(req, 'id');
    if (req.query.hasOwnProperty('name')) filters.name = RetrieveQueryParameter(req, 'name');
    if (req.query.hasOwnProperty('type')) filters.type = RetrieveQueryParameter(req, 'type');

    let results = await SetDao.RetrieveWithFilters(origin, filters);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.end(JSON.stringify(results));
});

app.get('/query', async function(req, res) {
    DefaultHeaders(res);

    let input = RetrieveQueryParameter(req, 'input', false);
    let decodedInput = decodeURI(input);

    if (!input) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'input' parameter is required...` }));

        return;
    }

    let validation = ValidateQuerySyntax(decodedInput);

    if (!validation.result) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `Query syntax error: ${validation.output}` }));

        return;
    }

    let results = await CardDao.RetrieveWithAdvancedQueryLanguage(validation.output);

    results.sort(function(a, b) {
        return a.Id - b.Id;
    });

    res.end(JSON.stringify(results));
});

// /decks endpoints

app.delete('/decks/:deckId', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    let deckId = req.params.deckId;

    if (!ObjectId.isValid(deckId)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }
    
    const result = await DeckDao.DeleteDeck(deckId);

    if (!result || !result.acknowledged) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        
        return;
    }
    else if (result.deletedCount == 0) {
        res.status(STATUS_CODES.NOT_FOUND)
            .end(JSON.stringify({ error: ID_NOT_FOUND_APOLOGY }));

        return;
    }

    res.status(STATUS_CODES.NO_CONTENT)
        .end();
});

app.get('/decks', async function(req, res) {
    DefaultHeaders(res);

    let filters = {};

    if (req.query.hasOwnProperty('id')) filters._id = RetrieveQueryParameter(req, 'id', false);
    if (req.query.hasOwnProperty('authorId')) filters.authorId = RetrieveQueryParameter(req, 'authorId', false);
    if (req.query.hasOwnProperty('heroSetId')) filters.heroSetId = RetrieveQueryParameter(req, 'heroSetId', false);
    if (req.query.hasOwnProperty('isOfficial')) filters.isOfficial = RetrieveQueryParameter(req, 'isOfficial', false);
    if (req.query.hasOwnProperty('isPublic')) filters.isPublic = RetrieveQueryParameter(req, 'isPublic', false);
    if (req.query.hasOwnProperty('title')) filters.title = RetrieveQueryParameter(req, 'title', false);

    if ((filters._id && !ObjectId.isValid(filters._id)) || (filters.authorId && !ObjectId.isValid(filters.authorId))) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }

	let decks = (Object.keys(filters).length > 0) ? await DeckDao.RetrieveDeckWithFilters(filters) : await DeckDao.RetrieveAllDecks();

    res.end(decks ? JSON.stringify(decks) : []);
});

app.get('/decks/:deckId', async function(req, res) {
    DefaultHeaders(res);

    let deckId = req.params.deckId;

    if (!ObjectId.isValid(deckId)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }

    const result = await DeckDao.RetrieveDeckWithFilters({ _id: deckId });

    if (!result) {
        res.status(STATUS_CODES.NOT_FOUND)
            .end(JSON.stringify({ error: ID_NOT_FOUND_APOLOGY }));

        return;
    }

    res.end(JSON.stringify(result));
});

app.post('/decks', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    const deck = req.body;

    if (!ObjectId.isValid(deck.authorId)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }

    deck.authorId = new ObjectId(deck.authorId);

    const formattedDeck = new DeckEntity(deck);

    formattedDeck.created = Date.now();
    formattedDeck.updated = Date.now();
    
    const result = await DeckDao.StoreNewDeck(formattedDeck);

    if (!result) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        
        return;
    }

    if (!result.acknowledged) {
        if (result.code == DUPLICATE_CODE) {
            res.status(STATUS_CODES.CONFLICT)
                .end(JSON.stringify({ error: DUPLICATE_APOLOGY }));
        }
        else if (result.code == VALIDATION_CODE) {
            let formattedErrors = FormatValidationErrors(result.errInfo.details.schemaRulesNotSatisfied);

            res.status(STATUS_CODES.BAD_REQUEST)
                .end(JSON.stringify({ error: VALIDATION_APOLOGY, validationErrors: formattedErrors }));
        }
        else {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
                .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        }

        return;
    }

    const createdDeck = await DeckDao.RetrieveDeckWithFilters({ _id: result.insertedId });

    res.status(STATUS_CODES.CREATED)
        .end(JSON.stringify(createdDeck));
});

app.put('/decks/:deckId', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    let deckId = req.params.deckId;
    
    if (!ObjectId.isValid(deckId)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }

    const deck = req.body;

    if (deck.hasOwnProperty('authorId')) {
        if (!ObjectId.isValid(deck.authorId)) {
            res.status(STATUS_CODES.BAD_REQUEST)
                .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

            return;
        }

        deck.authorId = new ObjectId(deck.authorId);
    }

    const formattedDeck = new DeckEntity(deck);

    delete formattedDeck._id;

    formattedDeck.updated = Date.now();
    
    const result = await DeckDao.UpdateDeck(deckId, formattedDeck);

    if (!result) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        
        return;
    }

    if (!result.acknowledged) {
        if (result.code == DUPLICATE_CODE) {
            res.status(STATUS_CODES.CONFLICT)
                .end(JSON.stringify({ error: DUPLICATE_APOLOGY }));
        }
        else if (result.code == VALIDATION_CODE) {
            let formattedErrors = FormatValidationErrors(result.errInfo.details.schemaRulesNotSatisfied);

            res.status(STATUS_CODES.BAD_REQUEST)
                .end(JSON.stringify({ error: VALIDATION_APOLOGY, validationErrors: formattedErrors }));
        }
        else {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
                .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        }

        return;
    }
    else if (result.matchedCount == 0) {
        res.status(STATUS_CODES.NOT_FOUND)
            .end(JSON.stringify({ error: ID_NOT_FOUND_APOLOGY }));

        return;
    }

    const updatedDeck = await DeckDao.RetrieveDeckWithFilters({ _id: deckId });

    res.end(JSON.stringify(updatedDeck));
});

// /users endpoints

app.delete('/users/:userId', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    let userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }
    
    const result = await UserDao.DeleteUser(userId);

    if (!result || !result.acknowledged) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        
        return;
    }
    else if (result.deletedCount == 0) {
        res.status(STATUS_CODES.NOT_FOUND)
            .end(JSON.stringify({ error: ID_NOT_FOUND_APOLOGY }));

        return;
    }

    res.status(STATUS_CODES.NO_CONTENT)
        .end();
});

app.get('/users', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    let filters = {};

    if (req.query.hasOwnProperty('id')) filters._id = RetrieveQueryParameter(req, 'id', false);
    if (req.query.hasOwnProperty('emailAddress')) filters.emailAddress = RetrieveQueryParameter(req, 'emailAddress', false);

    let results = [];

    if (Object.keys(filters).length > 0) {
        let user = await UserDao.RetrieveUserWithFilters(!authorized, filters);

        if (user) {
            results.push(user);
        }
    }
    else {
        let users = await UserDao.RetrieveAllUsers(!authorized);

        if (users) {
            results = users;
        }
    }

    res.end(JSON.stringify(results));
});

app.post('/users', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    const user = req.body;

    const formattedUser = new UserEntity(user);

    formattedUser.created = Date.now();
    formattedUser.updated = Date.now();
    
    const result = await UserDao.StoreNewUser(formattedUser);

    if (!result) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        
        return;
    }

    if (!result.acknowledged) {
        if (result.code == DUPLICATE_CODE) {
            res.status(STATUS_CODES.CONFLICT)
                .end(JSON.stringify({ error: DUPLICATE_APOLOGY }));
        }
        else if (result.code == VALIDATION_CODE) {
            let formattedErrors = FormatValidationErrors(result.errInfo.details.schemaRulesNotSatisfied);

            res.status(STATUS_CODES.BAD_REQUEST)
                .end(JSON.stringify({ error: VALIDATION_APOLOGY, validationErrors: formattedErrors }));
        }
        else {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
                .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        }

        return;
    }

    const createdUser = await UserDao.RetrieveUserWithFilters(false, { _id: result.insertedId });

    res.status(STATUS_CODES.CREATED)
        .end(JSON.stringify(createdUser));
});

app.put('/users/:userId', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    let userId = req.params.userId;
    
    if (!ObjectId.isValid(userId)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: BAD_ID_APOLOGY }));

        return;
    }

    const user = req.body;

    const formattedUser = new UserEntity(user);

    delete formattedUser._id;

    formattedUser.updated = Date.now();
    
    const result = await UserDao.UpdateUser(userId, formattedUser);

    if (!result) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        
        return;
    }

    if (!result.acknowledged) {
        if (result.code == DUPLICATE_CODE) {
            res.status(STATUS_CODES.CONFLICT)
                .end(JSON.stringify({ error: DUPLICATE_APOLOGY }));
        }
        else if (result.code == VALIDATION_CODE) {
            let formattedErrors = FormatValidationErrors(result.errInfo.details.schemaRulesNotSatisfied);

            res.status(STATUS_CODES.BAD_REQUEST)
                .end(JSON.stringify({ error: VALIDATION_APOLOGY, validationErrors: formattedErrors }));
        }
        else {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
                .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        }

        return;
    }
    else if (result.matchedCount == 0) {
        res.status(STATUS_CODES.NOT_FOUND)
            .end(JSON.stringify({ error: ID_NOT_FOUND_APOLOGY }));

        return;
    }

    const updatedUser = await UserDao.RetrieveUserWithFilters(false, { _id: userId });

    res.end(JSON.stringify(updatedUser));
});

app.post('/users/login', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await ValidateToken(req);

    if (!authorized) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: UNAUTHORIZED_APOLOGY }));

        return;
    }

    const user = req.body;

    const formattedUser = new UserEntity(user);

    let errors = [];

    if (!formattedUser.username && !formattedUser.emailAddress) {
        errors.push(`Either the 'username' or 'emailAddress' property must be populated...`);
    }

    if (!formattedUser.passwordHash) {
        errors.push(`The 'passwordHash' property must be populated...`);
    }

    if (errors.length > 0) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: VALIDATION_APOLOGY, validationErrors: errors }));

        return;
    }
    
    const result = await UserDao.RetrieveUserWithFilters(false, formattedUser);

    if (!result) {
        res.status(STATUS_CODES.NOT_FOUND)
            .end(JSON.stringify({ error: USER_NOT_FOUND_APOLOGY }));

        return;
    }
    else if (result.passwordHash != formattedUser.passwordHash) {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .end(JSON.stringify({ error: INVALID_PASSWORD_APOLOGY }));

        return;
    }
    else {
        res.status(STATUS_CODES.OK)
            .end(JSON.stringify(result));
    }
});

// Invalid paths

app.delete('*', function(req, res) {
    res.status(STATUS_CODES.NOT_FOUND)
        .end(JSON.stringify({ error: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)] }));
});

app.get('*', function(req, res) {
    res.status(STATUS_CODES.NOT_FOUND)
        .end(JSON.stringify({ error: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)] }));
});

app.post('*', function(req, res) {
    res.status(STATUS_CODES.NOT_FOUND)
        .end(JSON.stringify({ error: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)] }));
});

app.put('*', function(req, res) {
    res.status(STATUS_CODES.NOT_FOUND)
        .end(JSON.stringify({ error: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)] }));
});

var server = app.listen(process.env.PORT || 80, '0.0.0.0', function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("API listening at %s:%s", host, port);
});