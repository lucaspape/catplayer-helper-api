const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

var dbAdapter = new FileSync('db.json');
var db = lowdb(dbAdapter);
db.defaults({
    tracks: [],
    releases: []
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

var browseReleases = function(limit, skip, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/releases?limit=' + limit + '&skip=' + skip,
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

var initializeDatabase = function() {
  console.log('Starting init...');

  fs.unlinkSync('db.json');

  dbAdapter = new FileSync('catalog-db.json');
  db = lowdb(dbAdapter);
  db.defaults({
      tracks: [],
      releases: []
    })
    .write();

  initCatalog(function() {
    initReleases(function() {
      console.log('Database init done!');
    });
  });
}

var initCatalog = function(callback) {
  const removeKeys = ['streamable', 'downloadable', 'inEarlyAccess'];

  browseTracks(-1, 0,
    function(json) {
      console.log('Received catalog data...');
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

        track.search = track.artistsTitle;
        track.search += track.genrePrimary;
        track.search += track.genreSecondary;
        track.search += track.id;
        track.search += track.release.artistsTitle;
        track.search += track.title;
        track.search += track.version;

        for (var k = 0; k < track.tags.length; k++) {
          track.search += track.tags[k];
        }

        db.get('tracks')
          .push(track)
          .write();
      }

      callback();
    },

    function(err) {
      console.log(err);
    });
}

var initReleases = function(callback) {
  const removeKeys = ['streamable', 'downloadable', 'inEarlyAccess'];

  browseReleases(-1, 0,
    function(json) {
      console.log('Received release data...');
      const total = json.total;

      for (var i = 0; i < json.results.length; i++) {
        if (i % 100 === 0) {
          console.log((i / total) * 100 + '%');
        }

        var release = json.results[i];
        release.sortId = i;

        for (var k = 0; k < removeKeys.length; k++) {
          delete release[removeKeys[k]];
        }

        db.get('releases')
          .push(release)
          .write();
      }

      callback();
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

  const trackArray = db.get('tracks').sortBy('sortId').slice(skip, skip + limit).value();

  for (var i = 0; i < trackArray.length; i++) {
    delete trackArray[i]['sortId'];
    delete trackArray[i]['search'];
  }

  var returnObject = {
    results: trackArray
  };

  res.send(returnObject);
});

app.get(APIPREFIX + '/releases', (req, res) => {
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

  const releaseArray = db.get('releases').sortBy('sortId').slice(skip, skip + limit).value();

  for (var i = 0; i < releaseArray.length; i++) {
    delete releaseArray[i]['sortId'];
  }

  var returnObject = {
    results: releaseArray
  };

  res.send(returnObject);
});

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  const searchString = req.query.term.replace(/[^\x20-\x7E]/g, "");
  const terms = searchString.split();

  var trackArray = db.get('tracks').filter(track => new RegExp(terms[0], 'i').test(track.search)).value();

  for (var k = 1; k < terms.length; k++) {
    trackArray.filter(track => new RegExp(terms[k], 'i').test(track.search))
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
    results: trackArray
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