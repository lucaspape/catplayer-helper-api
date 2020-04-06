const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const PORT = 6000;
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

app.get(APIPREFIX + '/catalog', (req, res) => {
  const dbAdapter = new FileSync(catalogDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(catalogDBDefaults)
    .write();

  var skip = 0;
  var limit = 50;
  var gold = false

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

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

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  const dbAdapter = new FileSync(catalogDBFile);
  const db = lowdb(dbAdapter);
  db.defaults(catalogDBDefaults)
    .write();

  var skip = 0;
  var limit = 50;
  var gold = false;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (req.query.gold !== undefined) {
    if (req.query.gold === true) {
      gold = true;
    }
  }

  const searchString = req.query.term.trim();
  const terms = searchString.replace(/[^\x20-\x7E]/g, "").split(' ');

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
    trackArray[i].similarity = similarity(trackArray[i].search, searchString);
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