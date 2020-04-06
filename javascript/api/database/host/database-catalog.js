const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/v1';

const catalogDBFile = 'db-catalog.json';

const catalogDBDefaults = {
  tracks: [],
  tracksGold: []
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/', (req, res) => {
  const dbAdapter = new FileSync(catalogDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(catalogDBDefaults)
    .write();

  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    var gold = false;

    if (req.query.gold !== undefined) {
      if (req.query.gold === true) {
        gold = true;
      }
    }

    var trackArray = [];

    if (gold) {
      trackArray = db.get('tracksGold').sortBy('sortId').slice(skip, skip + limit).value();
    } else {
      trackArray = db.get('tracks').sortBy('sortId').slice(skip, skip + limit).value();
    }

    for (var i = 0; i < trackArray.length; i++) {
      delete trackArray[i]['sortId'];
      delete trackArray[i]['search'];
    }

    var returnObject = {
      results: trackArray
    };

    res.send(returnObject);
  });
});

app.get(APIPREFIX + '/search', (req, res) => {
  const dbAdapter = new FileSync(catalogDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(catalogDBDefaults)
    .write();

  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    var gold = false;

    if (req.query.gold !== undefined) {
      if (req.query.gold === true) {
        gold = true;
      }
    }

    const searchString = utils.fixSearchString(req.query.term);
    const terms = searchString.split(' ');

    var trackArray = [];

    if (gold) {
      trackArray = db.get('tracksGold').filter(track => new RegExp(terms[0], 'i').test(track.search)).value();
    } else {
      trackArray = db.get('tracks').filter(track => new RegExp(terms[0], 'i').test(track.search)).value();
    }


    for (var k = 1; k < terms.length; k++) {
      trackArray = trackArray.filter(track => new RegExp(terms[k], 'i').test(track.search));
    }

    for (var i = 0; i < trackArray.length; i++) {
      trackArray[i].similarity = utils.similarity(trackArray[i].search, searchString);
    }

    trackArray = trackArray.sort((a, b) => (a.similarity - b.similarity)).reverse();

    for (var i = 0; i < trackArray.length; i++) {
      delete trackArray[i]['sortId'];
      delete trackArray[i]['similarity'];
      delete trackArray[i]['search'];
    }

    const returnObject = {
      results: trackArray.slice(skip, skip + limit)
    }

    res.send(returnObject);
  });
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});