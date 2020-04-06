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

const releasesDBFile = 'db-releases.json';

const releasesDBDefaults = {
  releases: [],
  releasesGold: []
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/releases', (req, res) => {
  const dbAdapter = new FileSync(releasesDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(releasesDBDefaults)
    .write();

  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    var gold = false;
    var releaseArray = [];

    if (gold) {
      releaseArray = db.get('releasesGold').sortBy('sortId').slice(skip, skip + limit).value();
    } else {
      releaseArray = db.get('releases').sortBy('sortId').slice(skip, skip + limit).value();
    }

    for (var i = 0; i < releaseArray.length; i++) {
      delete releaseArray[i]['sortId'];
      delete releaseArray[i]['search'];
    }

    var returnObject = {
      results: releaseArray
    };

    res.send(returnObject);
  });
});

app.get(APIPREFIX + '/releases/search', (req, res) => {
  const dbAdapter = new FileSync(releasesDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(releasesDBDefaults)
    .write();

  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    var gold = false;
    const searchString = utils.fixSearchString(req.query.term);
    const terms = searchString.split(' ');

    var releaseArray = [];

    if (gold) {
      releaseArray = db.get('releasesGold').filter(release => new RegExp(terms[0], 'i').test(release.search)).value();
    } else {
      releaseArray = db.get('releases').filter(release => new RegExp(terms[0], 'i').test(release.search)).value();
    }

    for (var k = 1; k < terms.length; k++) {
      releaseArray = releaseArray.filter(release => new RegExp(terms[k], 'i').test(release.search));
    }

    for (var i = 0; i < releaseArray.length; i++) {
      releaseArray[i].similarity = utils.similarity(releaseArray[i].search, searchString);
    }

    releaseArray = releaseArray.sort((a, b) => (a.similarity - b.similarity)).reverse();

    for (var i = 0; i < releaseArray.length; i++) {
      delete releaseArray[i]['sortId'];
      delete releaseArray[i]['similarity'];
      delete releaseArray[i]['search'];
    }

    const returnObject = {
      results: releaseArray.slice(skip, skip + limit)
    }

    res.send(returnObject);
  });
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});