const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const lowdb = require('lowdb');
const cookieParser = require('cookie-parser');
const FileSync = require('lowdb/adapters/FileSync');

const PORT = 6000;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/v1';

const dbDefaults = {
  tracks: [],
  releases: [],
  artists: []
};

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

function getSession(sid, callback, errorCallback) {
  request({
    headers: {
      'Cookie': 'connect.sid=' + sid
    },
    url: 'https://connect.monstercat.com/v2/self/session',
    method: 'GET'
  }, function(err, resp, body) {
    if (err) {
      errorCallback(err);
    } else {
      callback(JSON.parse(body));
    }
  });
}

app.get(APIPREFIX + '/catalog', (req, res) => {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
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

  const trackArray = db.get('tracks').sortBy('sortId').slice(skip, skip + limit).value();

  for (var i = 0; i < trackArray.length; i++) {
    delete trackArray[i]['sortId'];
    delete trackArray[i]['search'];
  }

  const sid = req.cookies['connect.sid'];

  getSession(sid,
    function(json) {
      trackArray = addMissingKeys(json.hasGold, trackArray);

      var returnObject = {
        results: trackArray
      };

      res.send(returnObject);
    },
    function(err) {
      res.send(err);
    });
});

app.get(APIPREFIX + '/releases', (req, res) => {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
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

  const releaseArray = db.get('releases').sortBy('sortId').slice(skip, skip + limit).value();

  for (var i = 0; i < releaseArray.length; i++) {
    delete releaseArray[i]['sortId'];
    delete releaseArray[i]['search'];
  }

  const sid = req.cookies['connect.sid'];

  getSession(sid,
    function(json) {
      releaseArray = addMissingKeys(json.hasGold, releaseArray);

      var returnObject = {
        results: releaseArray
      };

      res.send(returnObject);
    },
    function(err) {
      res.send(err);
    });
});

app.get(APIPREFIX + '/artists', (req, res) => {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
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

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
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

  var trackArray = db.get('tracks').filter(track => new RegExp(terms[0], 'i').test(track.search)).value();

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

app.get(APIPREFIX + '/releases/search', (req, res) => {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
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

  var releaseArray = db.get('releases').filter(release => new RegExp(terms[0], 'i').test(release.search)).value();

  for (var k = 1; k < terms.length; k++) {
    releaseArray = releaseArray.filter(release => new RegExp(terms[k], 'i').test(release.search));
  }

  for (var i = 0; i < releaseArray.length; i++) {
    releaseArray[i].similarity = similarity(releaseArray[i].search, searchString);
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

app.get(APIPREFIX + '/artists/search', (req, res) => {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
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

function addMissingKeys(hasGold, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].inEarlyAccess) {
      if (hasGold) {
        array[i].streamable = true;
        array[i].downloadable = false;
      } else {
        array[i].streamable = false;
        array[i].downloadable = false;
      }
    } else {
      if (hasGold) {
        array[i].streamable = true;
        array[i].downloadable = true;
      } else {
        array[i].streamable = true;
        array[i].downloadable = false;
      }
    }
  }

  return array;
}

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