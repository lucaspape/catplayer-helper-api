const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dbDefaults = {
  tracks: [],
  releases: [],
  artists: []
};

function browseTracks(limit, skip, callback, errorCallback) {
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

function browseReleases(limit, skip, callback, errorCallback) {
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

function browseArtists(limit, skip, callback, errorCallback) {
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

function initializeDatabase() {
  console.log('Starting init...');

  initArtists(function() {
    initCatalog(function() {
      initReleases(function() {
        fs.rename('db-temp.json', 'db.json', function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log('Database init done!');

            setTimeout(function() {
              initializeDatabase();
            }, 3600000);
          }
        });
      });
    });
  });
}

function initCatalog(callback) {
  const dbAdapter = new FileSync('db-temp.json');
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

function initReleases(callback) {
  const dbAdapter = new FileSync('db-temp.json');
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

function initArtists(callback) {
  const dbAdapter = new FileSync('db-temp.json');
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