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

var updateCatalogDatabase = function() {
  const removeKeys = ['streamable', 'downloadable', 'inEarlyAccess'];

  request({
    url: 'https://connect.monstercat.com/v2/catalog/browse?limit=50&skip=' + 0,
    method: 'GET'
  }, function(err, resp, body) {
    if (err) {
      console.log(err);
    } else {
      var respJson = JSON.parse(body);

      const total = respJson.total;

      var savedTracks = catalogDB.get('tracks').value().length;
      var rest = ((total - savedTracks) % 50);
      if (rest === 0) {
        rest = savedTracks;
      }
      console.log(rest);

      var skip = total - rest;

      if (skip >= 0) {
        console.log('Skip: ' + skip)

        request({
          url: 'https://connect.monstercat.com/v2/catalog/browse?limit=50&skip=' + skip,
          method: 'GET'
        }, function(err, result, body) {
          if (err) {
            console.log(err);
          } else {
            var result = JSON.parse(body).results;

            for (var i = 0; i < result.length; i++) {
              var track = result[i];
              track.sortId = skip + i;

              for (var k = 0; k < removeKeys.length; k++) {
                delete track[removeKeys[k]];
              }

              catalogDB.get('tracks')
                .push(track)
                .write();
            }

            setTimeout(function() {
              updateCatalogDatabase();
            }, 100);
          }
        });
      } else {
        setTimeout(function() {
          updateCatalogDatabase();
        }, 5000);
      }
    }
  });
}

updateCatalogDatabase();