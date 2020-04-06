const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const PORT = 6000;
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

app.get(APIPREFIX + '/artists', (req, res) => {
  const dbAdapter = new FileSync(artistsDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(artistsDBDefaults)
    .write();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

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

app.get(APIPREFIX + '/artists/search', (req, res) => {
  const dbAdapter = new FileSync(artistsDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(artistsDBDefaults)
    .write();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  const searchString = req.query.term.trim();
  const terms = searchString.replace(/[^\x20-\x7E]/g, "").split(' ');

  var artistsArray = db.get('artists').filter(release => new RegExp(terms[0], 'i').test(release.search)).value();

  for (var k = 1; k < terms.length; k++) {
    artistsArray = artistsArray.filter(artist => new RegExp(terms[k], 'i').test(artist.search));
  }

  for (var i = 0; i < artistsArray.length; i++) {
    artistsArray[i].similarity = similarity(artistsArray[i].search, searchString);
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

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

function similarity(s1, s2) {
  if (s1 !== undefined && s2 !== undefined) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return ((longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)) * 100.0;
  } else {
    return 0.0;
  }
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}