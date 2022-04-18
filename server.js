const { CardDao } = require('./dao/cardDao');
const { PackDao } = require('./dao/packDao');
const { SetDao } = require('./dao/setDao');
const { ResourceConverter } = require('./utilities/cardHelper');
const express = require('express');
const { OFFICIAL } = require('./constants');

const app = express();

app.get('/cards', async function(req, res) {
    let results = [];

    let origin = 'official';

    let aspectOption = req.query.aspect;
    let aspect = aspectOption ? aspectOption.toLowerCase() : null;

    let author = req.query.author;

    let cost = req.query.cost;

    let nameOption = req.query.name;
    let name = nameOption ? nameOption.toLowerCase() : null;

    let packOption = req.query.pack;
    let packIds = null;
    
    if (packOption) {
        let packs = await PackDao.RetrieveByNameRemotely(packOption, OFFICIAL);
        
        packIds = packs.map(x => x.Id);
    }

    let resourceOption = req.query.resource;
    let resource = resourceOption ? resourceOption.toLowerCase() : null;

    let setOption = req.query.set;
    let setIds = null;
    
    if (setOption) {
        let sets = await SetDao.RetrieveByNameRemotely(setOption, OFFICIAL);
        
        setIds = sets.map(x => x.Id);
    }

    let textOption = req.query.text;
    let text = textOption ? textOption.toLowerCase() : null;

    let traitsOption = req.query.traits;
    let traits = traitsOption ? traitsOption.split(',').map(x => x.toLowerCase().replace(/[^a-z0-9]/gmi, '')) : null;

    let typeOption = req.query.type;
    let type = typeOption ? typeOption.toLowerCase() : null;

    if ((packOption && packIds.length === 0) || (setOption && setIds.length === 0)) {
        results = [];
    }
    else {
        if (name && name.match(/([a-z0-9])/gi)) {
            results = await CardDao.RetrieveByName(name, origin, false);
    
            if (results) {
                if (aspect) results = results.filter(card => card.Classification.toLowerCase() === aspect);
                if (author) results = results.filter(card => card.AuthorId === author);
                if (cost) results = results.filter(card => card.Cost && card.Cost.toLowerCase() === cost);
                if (packIds) {
                    results = results.filter(card => card.Printings.some(printing => packIds.includes(printing.PackId)));
                }
                if (resource) {
                    if (resource === 'none') {
                        results = results.filter(card => !card.Resource);
                    }
                    else {
                        results = results.filter(card => card.Resource && card.Resource.toLowerCase().includes(resource));
                    }
                }
                if (setIds) {
                    results = results.filter(card => card.Printings.some(printing => setIds.includes(printing.SetId)));
                }
                if (text) results = results.filter(card => (card.Rules && card.Rules.toLowerCase().includes(text)) || (card.Special && card.Special.toLowerCase().includes(text)));
                if (traits) results = results.filter(card => card.Traits && traits.every(element => card.Traits.find(trait => trait.toLowerCase() === element.trim())));
                if (type) results = results.filter(card => card.Type.toLowerCase() === type);
            }
        }
        else {
            results = await CardDao.RetrieveWithFilters(origin, aspect, author, cost, packIds, resource, setIds, text, traits, type, false);
        }
    }

    results.sort(function(a, b) {
        return a.Id - b.Id;
    });

    res.end(JSON.stringify(results));
});

var server = app.listen(process.env.PORT || 80, '0.0.0.0', function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("API listening at %s:%s", host, port);
});