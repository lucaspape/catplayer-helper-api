const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const utils = require('./utils.js');

const artistsDBDefaults = {
  artists: []
}

const artistsDBFile = 'db-artists.json';
const artistsDBTempFile = 'db-artists-temp.json';

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

  utils.download('https://lucaspape.de/monstercat-app/' + artistsDBFile, artistsDBFile, function() {
    initArtists(function() {
      console.log('Database init done!');

      setTimeout(function() {
        initializeDatabase();
      }, 3600000);
    });
  });
}

function initArtists(callback) {
  const dbAdapter = new FileSync(artistsDBTempFile);
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

      fs.rename(artistsDBTempFile, artistsDBFile, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Artists db init done!');
        }
      });

      callback();
    },

    function(err) {
      console.log(err);
    });
}

initializeDatabase();