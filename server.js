const { CardDao } = require('./dao/cardDao');
const { PackDao } = require('./dao/packDao');
const { SetDao } = require('./dao/setDao');
const { ResourceConverter } = require('./utilities/cardHelper');
const express = require('express');
const { OFFICIAL, ALL, UNOFFICIAL, FALSE, TRUE } = require('./constants');
const { ArtistDao } = require('./dao/artistDao');

const app = express();

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
    DefaultHeaders(res);
    
    let results = [];
    
    let origin = req.query.origin?.toLowerCase() || OFFICIAL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(400)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }
    
    let incomplete = req.query.incomplete?.toLowerCase();

    if (incomplete && ![FALSE, TRUE].includes(incomplete)) {
        res.status(400)
            .end(JSON.stringify({ error: `The 'incomplete' parameter must be '${FALSE}' or '${TRUE}'...` }));

        return;
    }

    let aspect = req.query.aspect?.toLowerCase();
    let author = req.query.author;
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
    }

    if ((!packOption || packIds.length > 0) && (!setOption || setIds.length > 0)) {
        if (name && name.match(/([a-z0-9])/gi)) {
            results = await CardDao.RetrieveByName(name, origin, false);
    
            if (results) {
                if (aspect) results = results.filter(card => card.Classification.toLowerCase() === aspect);
                if (author) results = results.filter(card => card.AuthorId === author);
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
            results = await CardDao.RetrieveWithFilters(origin, aspect, author, cost, incomplete, packIds, resource, setIds, text, traits, type, false);
        }
    }

    results.sort(function(a, b) {
        return a.Id - b.Id;
    });

    res.end(JSON.stringify(results));
});

app.get('/packs', async function(req, res) {
    DefaultHeaders(res);

    let origin = req.query.origin?.toLowerCase() || OFFICIAL;

    if (![ALL, OFFICIAL, UNOFFICIAL].includes(origin)) {
        res.status(400)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }
    
    let incomplete = req.query.incomplete?.toLowerCase();

    if (incomplete && ![FALSE, TRUE].includes(incomplete)) {
        res.status(400)
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
        res.status(400)
            .end(JSON.stringify({ error: `The 'origin' parameter must be '${ALL}', '${OFFICIAL}', or '${UNOFFICIAL}'...` }));

        return;
    }

    let id = req.query.id?.toLowerCase();
    let name = req.query.name?.toLowerCase();

    let results = await SetDao.RetrieveWithFilters(origin, id, name);

    results.sort(function(a, b) {
        return a.Name - b.Name;
    });

    res.DefaultHeaders()
        .end(JSON.stringify(results));
});

app.get('*', function(req, res) {
    let errors = [
        'These are not the URLs you\'re looking for...',
        'You\'ve reached the void of space...',
        'You need to work on your typing skills...',
        'The page that was here is mad at you and doesn\'t want to see you right now...',
        'You don\'t belong here...'
    ]

    res.status(404)
        .end(JSON.stringify({ error: errors[Math.floor(Math.random() * errors.length)] }));
});

var server = app.listen(process.env.PORT || 80, '0.0.0.0', function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("API listening at %s:%s", host, port);
});