const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { fork } = require('child_process');
const utils = require('./utils.js');

const PORT = 80;
const APIPREFIX = '/related';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const dbName = 'monstercatDB';

const sqlhelper = require('/app/api/sqlhelper.js');

sqlhelper.getConnection(
  function (mysqlConnection) {
    app.post(APIPREFIX + '/', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const skipMonstercatTracks = (req.query.skipMC === 'true');
        const tracks = req.body.tracks;
        const exclude = req.body.exclude;

        getSearchFromIds(tracks, mysqlConnection, function (search) {
          var catalogSongQuery = 'SELECT id,search FROM `' + dbName + '`.`catalog` WHERE ' + 'id!="' + search[0].id + '" ';

          for (var i = 1; i < search.length; i++) {
            catalogSongQuery += 'AND id != "' + search[i].id + '" ';
          }

          if (exclude !== undefined) {
            for (var i = 0; i < exclude.length; i++) {
              catalogSongQuery += 'AND id != "' + exclude[i].id + '" ';
            }
          }

          if (skipMonstercatTracks) {
            catalogSongQuery += 'AND artistsTitle NOT LIKE "Monstercat" ';
          }

          catalogSongQuery += ';';

          mysqlConnection.query(catalogSongQuery, (err, result) => {
            if (err) {
              res.send(err);
            } else {
              const process = fork('/app/api/processors/related-processor.js');
              process.send({
                searchArray: search,
                sqlResult: result
              });

              process.on('message', (processResult) => {
                res.send(processResult);
              });
            }
          });
        }, function (err) {
          console.log(err);
          res.send(err);
        })
      });
    });

    app.listen(PORT, () => {
      console.log('Server started on port ' + PORT);
    });
  },
  function (err) {
    return err;
  })

function getSearchFromIds(trackArray, mysqlConnection, callback, errorCallback) {
  var trackSearch = [];

  var i = 0;

  var sqlCallback = function () {
    if (i < trackArray.length) {
      const catalogSongQuery = 'SELECT id,search FROM `' + dbName + '`.`catalog` WHERE id="' + trackArray[i].id + '";';

      mysqlConnection.query(catalogSongQuery, (err, result) => {
        if (err) {
          errorCallback(err);
        } else {
          trackSearch[i] = result[0];
          i++;
          sqlCallback();
        }
      });
    } else {
      //DONE
      callback(trackSearch);
    }
  }

  sqlCallback();
}