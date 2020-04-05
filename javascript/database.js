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