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

const artistsDBFile = 'db-artists.json';

const artistsDBDefaults = {
  artists: []
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/', (req, res) => {
  const dbAdapter = new FileSync(artistsDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(artistsDBDefaults)
    .write();

  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    const artistsArray = db.get('artists').sortBy('sortId').slice(skip, skip + limit).value();

    for (var i = 0; i < artistsArray.length; i++) {
      delete artistsArray[i]['sortId'];
      delete artistsArray[i]['search'];
    }

    var returnObject = {
      results: artistsArray
    };

    res.send(returnObject);
  });
});

app.get(APIPREFIX + '/search', (req, res) => {
  const dbAdapter = new FileSync(artistsDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(artistsDBDefaults)
    .write();

  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    const searchString = utils.fixSearchString(req.query.term)
    const terms = searchString.split(' ');

    var artistsArray = db.get('artists').filter(release => new RegExp(terms[0], 'i').test(release.search)).value();

    for (var k = 1; k < terms.length; k++) {
      artistsArray = artistsArray.filter(artist => new RegExp(terms[k], 'i').test(artist.search));
    }

    for (var i = 0; i < artistsArray.length; i++) {
      artistsArray[i].similarity = utils.similarity(artistsArray[i].search, searchString);
    }

    artistsArray = artistsArray.sort((a, b) => (a.similarity - b.similarity)).reverse();

    for (var i = 0; i < artistsArray.length; i++) {
      delete artistsArray[i]['sortId'];
      delete artistsArray[i]['similarity'];
      delete artistsArray[i]['search'];
    }

    const returnObject = {
      results: artistsArray.slice(skip, skip + limit)
    }

    res.send(returnObject);
  });
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});