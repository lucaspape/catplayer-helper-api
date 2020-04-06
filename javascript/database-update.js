const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const catalogDBDefaults = {
  tracks: [],
  tracksGold: []
}

const releasesDBDefaults = {
  releases: [],
  releasesGold: []
}

const artistsDBDefaults = {
  artists: []
}

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
        console.log('Database init done!');

        setTimeout(function() {
          initializeDatabase();
        }, 3600000);
      });
    });
  });
}

function initCatalog(callback) {
  const dbAdapter = new FileSync('db-catalog-temp.json');
  const db = lowdb(dbAdapter);
  db.defaults(catalogDBDefaults)
    .write();

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

        track.downloadable = false;

        if (track.inEarlyAccess) {
          track.streamable = false;
        } else {
          track.streamable = true;
        }

        db.get('tracks')
          .push(track)
          .write();

        track.streamable = true;

        if (track.inEarlyAccess) {
          track.downloadable = false;
        } else {
          track.downloadable = true;
        }

        db.get('tracksGold')
          .push(track)
          .write();
      }

      fs.rename('db-catalog-temp.json', 'db-catalog.json', function(err) {
        console.log(err);
      });

      callback();
    },

    function(err) {
      console.log(err);
    });
}

function initReleases(callback) {
  const dbAdapter = new FileSync('db-releases-temp.json');
  const db = lowdb(dbAdapter);
  db.defaults(releasesDBDefaults)
    .write();

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

        release.downloadable = false;

        if (release.inEarlyAccess) {
          release.streamable = false;
        } else {
          release.streamable = true;
        }

        db.get('releases')
          .push(release)
          .write();

        release.streamable = true;

        if (release.inEarlyAccess) {
          release.downloadable = false;
        } else {
          release.downloadable = true;
        }

        db.get('releasesGold')
          .push(release)
          .write();
      }

      fs.rename('db-releases-temp.json', 'db-releases.json', function(err) {
        console.log(err);
      });

      callback();
    },

    function(err) {
      console.log(err);
    });
}

function initArtists(callback) {
  const dbAdapter = new FileSync('db-artists-temp.json');
  const db = lowdb(dbAdapter);
  db.defaults(artistsDBDefaults)
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

      fs.rename('db-artists-temp.json', 'db-artists.json', function(err) {
        console.log(err);
      });

      callback();
    },

    function(err) {
      console.log(err);
    });
}

initializeDatabase();