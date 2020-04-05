const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const catalogDBAdapter = new FileSync('catalog-db.json');
const catalogDB = lowdb(catalogDBAdapter);
catalogDB.defaults({
    tracks: []
  })
  .write();

const PORT = 6000;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/v1';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var browseTracks = function(limit, skip, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/catalog/browse?limit=' + limit + '&skip=' + skip,
      method: 'GET'
    },
    function(err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        callback(JSON.parse(body));
      }
    });
}

var getTotalTracks = function(callback, errorCallback) {
  browseTracks(0, 0,
    function(json) {
      callback(json.total);
    },
    function(err) {
      errorCallback(err);
    });
}

var initializeDatabase = function() {
  console.log('Starting init...');
  const removeKeys = ['streamable', 'downloadable', 'inEarlyAccess'];

  browseTracks(-1, 0,
    function(json) {
      console.log('Received data...');
      const total = json.total;

      for (var i = 0; i < json.results.length; i++) {
        if (i % 100 === 0) {
          console.log((i / total) * 100 + '%');
        }

        var track = json.results[i];
        track.sortId = i;

        for (var k = 0; k < removeKeys.length; k++) {
          delete track[removeKeys[k]];
        }

        catalogDB.get('tracks')
          .push(track)
          .write();
      }

      console.log('Database init done!');
    },

    function(err) {
      console.log(err);
    });
}

initializeDatabase();

app.get(APIPREFIX + '/catalog/browse', (req, res) => {
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

  const trackArray = catalogDB.get('tracks').sortBy('sortId').slice(skip, skip + limit).value();

  var returnObject = {
    results: trackArray
  };

  res.send(returnObject);
});

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  const searchString = req.query.term.replace(/[^ -~]+/g, "");

  const titleArray = catalogDB.get('tracks').filter(track => new RegExp(searchString, 'i').test(track.title)).value();
  const versionArray = catalogDB.get('tracks').filter(track => new RegExp(searchString, 'i').test(track.version)).value();
  const titleVersionArray = catalogDB.get('tracks').filter(track => new RegExp(searchString, 'i').test(track.title + " " + track.version)).value();
  const artistArray = catalogDB.get('tracks').filter(track => new RegExp(searchString, 'i').test(track.artistsTitle)).value();

  const trackArray = [];

  if (titleArray.length > 0) {
    for (var i = 0; i < titleArray.length; i++) {
      titleArray[i].confidence = similarity(titleArray[i].title, searchString);
    }

    trackArray.push(...titleArray);
  }

  if (versionArray.length > 0) {
    for (var i = 0; i < versionArray.length; i++) {
      versionArray[i].confidence = similarity(versionArray[i].version, searchString);
    }

    trackArray.push(...versionArray);
  }

  if (titleVersionArray.length > 0) {
    for (var i = 0; i < titleVersionArray.length; i++) {
      titleVersionArray[i].confidence = similarity(titleVersionArray[i].title + " " + titleVersionArray[i].title, searchString);
    }

    trackArray.push(...titleVersionArray);
  }

  if (artistArray.length > 0) {
    for (var i = 0; i < artistArray.length; i++) {
      artistArray[i].confidence = similarity(artistArray[i].artistsTitle, searchString);
    }

    trackArray.push(...artistArray);
  }

  var returnObject = {
    results: trackArray.sort((a, b) => (a.confidence - b.confidence)).reverse()
  };

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