const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const utils = require('./utils.js');

const catalogDBDefaults = {
  tracks: [],
  tracksGold: []
}

const catalogDBFile = 'db-catalog.json';
const catalogDBTempFile = 'db-catalog-temp.json';

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

function initializeDatabase() {
  console.log('Starting init...');

  utils.download('https://lucaspape.de/monstercat-app/' + catalogDBFile, catalogDBFile, function() {
    initCatalog(function() {
      console.log('Database init done!');

      setTimeout(function() {
        initializeDatabase();
      }, 3600000);
    });

  });
}

function initCatalog(callback) {
  const dbAdapter = new FileSync(catalogDBTempFile);
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

      fs.rename(catalogDBTempFile, catalogDBFile, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Catalog init done!');
        }
      });

      callback();
    },

    function(err) {
      console.log(err);
    });
}

initializeDatabase();