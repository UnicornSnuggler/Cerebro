const { CardDao } = require('./dao/cardDao');
const { PackDao } = require('./dao/packDao');
const { SetDao } = require('./dao/setDao');
const { UserDao } = require('./dao/userDao');
const { OFFICIAL, ALL, UNOFFICIAL, FALSE, TRUE, UNAUTHORIZED_APOLOGY, VALIDATION_APOLOGY, VALIDATION_ERRORS, DUPLICATE_CODE, DUPLICATE_APOLOGY, VALIDATION_CODE, STATUS_CODES, ERROR_MESSAGES, BAD_ID_APOLOGY, ID_NOT_FOUND_APOLOGY } = require('./constants');
const { ArtistDao } = require('./dao/artistDao');
const { FormattingDao } = require('./dao/formattingDao');
const { ValidateQuerySyntax } = require('./utilities/queryHelper');

const axios = require('axios');
const express = require('express');
const { UserEntity } = require('./models/userEntity');
const { ObjectId } = require('mongodb/lib/bson');

const app = express();

app.use(express.json());

function DefaultHeaders(res) {
    res.setHeader('Content-Type', 'application/json')
        .setHeader('Access-Control-Allow-Origin', '*');
}

app.get('/artists', async function(req, res) {
    DefaultHeaders(res);
    
    let id = req.query.id;
    let name = req.query.name?.toLowerCase();

    let results = await ArtistDao.RetrieveWithFilters(id, name);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.end(JSON.stringify(results));
});

app.get('/cards', async function(req, res) {
    let body = req.body;

    DefaultHeaders(res);
    
    let results = [];
    
    let origin = req.query.origin?.toLowerCase() || ALL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }
    
    let incomplete = req.query.incomplete?.toLowerCase();

    if (incomplete && ![FALSE, TRUE].includes(incomplete)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'incomplete' parameter must be '${FALSE}' or '${TRUE}'...` }));

        return;
    }

    let author = req.query.author;
    let boost = req.query.boost;
    let classification = req.query.classification?.toLowerCase();
    let cost = req.query.cost;
    let name = req.query.name?.toLowerCase();
    let resource = req.query.resource?.toLowerCase();
    let text = req.query.text?.toLowerCase();
    let traits = req.query.traits?.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, ''));
    let type = req.query.type?.toLowerCase();

    let packOption = req.query.pack?.toLowerCase();
    let packIds = null;
    
    if (packOption) {
        let packs = await PackDao.RetrieveWithFilters(origin, null, packOption);
        packs = packs.concat(await PackDao.RetrieveWithFilters(origin, packOption, null));
        
        packIds = packs.map(x => x.Id);
    }
    
    let setOption = req.query.set?.toLowerCase();
    let setIds = null;
    
    if (setOption) {
        let sets = await SetDao.RetrieveWithFilters(origin, null, setOption);
        sets = sets.concat(await SetDao.RetrieveWithFilters(origin, setOption, null));
        
        setIds = sets.map(x => x.Id);

        if (body.setIds) {
            setIds = setIds.concat(body.setIds);
        }
    }
    else if (body.setIds) {
        setIds = body.setIds;
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
            results = await CardDao.RetrieveWithFilters(origin, author, boost, classification, cost, incomplete, packIds, resource, setIds, text, traits, type, false);
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

    let origin = req.query.origin?.toLowerCase() || OFFICIAL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }
    
    let incomplete = req.query.incomplete?.toLowerCase();

    if (incomplete && ![FALSE, TRUE].includes(incomplete)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'incomplete' parameter must be '${FALSE}' or '${TRUE}'...` }));

        return;
    }

    let id = req.query.id?.toLowerCase();
    let name = req.query.name?.toLowerCase();

    let results = await PackDao.RetrieveWithFilters(origin, id, incomplete, name);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.end(JSON.stringify(results));
});

app.get('/sets', async function(req, res) {
    DefaultHeaders(res);

    let origin = req.query.origin?.toLowerCase() || OFFICIAL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }

    let id = req.query.id?.toLowerCase();
    let name = req.query.name?.toLowerCase();

    let results = await SetDao.RetrieveWithFilters(origin, id, name);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.end(JSON.stringify(results));
});

app.get('/query', async function(req, res) {
    DefaultHeaders(res);

    let input = req.query.input;
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

app.delete('/users/:userId', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await validateToken(req);

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

    if (!result.acknowledged) {
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

    let authorized = await validateToken(req);

    let id = req.query.id;
    let emailAddress = req.query.emailAddress;

    let results = [];

    if (id || emailAddress) {
        let user = await UserDao.RetrieveUserWithFilters(id, emailAddress, !authorized);

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

    let authorized = await validateToken(req);

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

    if (!result.acknowledged) {
        if (result.code == DUPLICATE_CODE) {
            res.status(STATUS_CODES.CONFLICT)
                .end(JSON.stringify({ error: DUPLICATE_APOLOGY }));
        }
        else if (result.code == VALIDATION_CODE) {
            let formattedErrors = formatValidationErrors(result.errInfo.details.schemaRulesNotSatisfied);

            res.status(STATUS_CODES.BAD_REQUEST)
                .end(JSON.stringify({ error: VALIDATION_APOLOGY, validationErrors: formattedErrors }));
        }
        else {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
                .end(JSON.stringify({ error: `An unknown error has occurred...` }));
        }

        return;
    }

    const updatedUser = await UserDao.RetrieveUserWithFilters(result.insertedId, null, false);

    res.status(STATUS_CODES.CREATED)
        .end(JSON.stringify(updatedUser));
});

app.put('/users/:userId', async function(req, res) {
    DefaultHeaders(res);

    let authorized = await validateToken(req);

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

    if (!result.acknowledged) {
        if (result.code == DUPLICATE_CODE) {
            res.status(STATUS_CODES.CONFLICT)
                .end(JSON.stringify({ error: DUPLICATE_APOLOGY }));
        }
        else if (result.code == VALIDATION_CODE) {
            let formattedErrors = formatValidationErrors(result.errInfo.details.schemaRulesNotSatisfied);

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

    const updatedUser = await UserDao.RetrieveUserWithFilters(userId, null, false);

    res.end(JSON.stringify(updatedUser));
});

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

function formatValidationErrors(rules) {
    let validationErrors = [];

    rules.forEach(rule => {
        if (rule.operatorName == 'properties') {
            rule.propertiesNotSatisfied.forEach(property => {
                validationErrors.push(`'${property.propertyName}' ${property.description}...`);
            });
        }
        else if (rule.operatorName == 'required') {
            rule.missingProperties.forEach(property => {
                validationErrors.push(`'${property}' is required...`);
            });
        }
    });
    
    return validationErrors;
};

async function validateToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.substring(7, authHeader.length);
    
    const request = await axios.get('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return request.data.id.toString() == process.env.githubUserId;
};