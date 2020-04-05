const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
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

var browseArtists = function(limit, skip, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/artists?limit=' + limit + '&skip=' + skip,
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
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
    .write();

  if (!(db.get('tracks').value().length > 0)) {
    console.log('Starting init...');

    initArtists(function() {
      initCatalog(function() {
        initReleases(function() {
          console.log('Database init done!');
        });
      });
    });
  }
}

var initCatalog = function(callback) {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
    .write();

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
        track.search += track.release.catalogId;
        track.search += track.release.id;
        track.search += track.title;
        track.search += track.version;

        for (var k = 0; k < track.tags.length; k++) {
          track.search += track.tags[k];
        }

        for (var k = 0; k < track.artists.length; k++) {
          track.search += track.artists[k].name;
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
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
    .write();

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

        release.search = release.artistsTitle;
        release.search += release.catalogId;
        release.search += release.genrePrimary;
        release.search += release.genreSecondary;
        release.search += release.title;
        release.search += release.version;
        release.search += release.id;

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

var initArtists = function(callback) {
  const dbAdapter = new FileSync('db.json');
  const db = lowdb(dbAdapter);
  db.defaults(dbDefaults)
    .write();

  const removeKeys = [];

  browseArtists(-1, 0,
    function(json) {
      console.log('Received artists data...');
      const total = json.total;

      for (var i = 0; i < json.results.length; i++) {
        if (i % 100 === 0) {
          console.log((i / total) * 100 + '%');
        }

        var artist = json.results[i];
        artist.sortId = i;

        artist.search = artist.id;
        artist.search += artist.uri;
        artist.search += artist.name;
        artist.search += artist.about;
        artist.search += artist.bookingDetails;
        artist.search += artist.managementDetails;
        artist.search += artist.links;

        for (var k = 0; k < removeKeys.length; k++) {
          delete artist[removeKeys[k]];
        }

        db.get('artists')
          .push(artist)
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

  var returnObject = {
    results: trackArray
  };

  res.send(returnObject);
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

  var returnObject = {
    results: releaseArray
  };

  res.send(returnObject);
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

  const searchString = req.query.term;
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

  const searchString = req.query.term;
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

  const searchString = req.query.term;
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