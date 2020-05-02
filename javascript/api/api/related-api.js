const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const utils = require('./utils.js');

const PORT = 80;
const APIPREFIX = '/related';
const dbName = 'monstercatDB';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const mysqlConnection = mysql.createConnection({
  host: 'mariadb',
  user: 'root',
  password: 'JacPV7QZ',
  database: dbName
});

mysqlConnection.connect(err => {
  if (err) {
    console.log(err);
    return err;
  } else {
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
              var arrayWithSimiliarity = [];

              var i = 0;

              var loopCallback = function () {
                if (i < search.length) {
                  var firstSearch = search[i].search.replace(search[i].id, '');

                  const process = fork('./process_related.js');
                  process.send({
                    firstSearch: firstSearch,
                    array: result
                  });

                  process.on('message', (processResult) => {
                    for (var k = 0; k < processResult.length; k++) {
                      var similarity = processResult[k].similarity;
                      const id = processResult[k].id;

                      if (arrayWithSimiliarity[k] !== undefined) {
                        similarity += arrayWithSimiliarity[k].similarity;
                      }

                      arrayWithSimiliarity[k] = {
                        id: id,
                        similarity: similarity
                      };
                    }

                    i++;
                    loopCallback();
                  });
                } else {
                  //sort
                  arrayWithSimiliarity.sort(function (a, b) {
                    if (a.similarity < b.similarity) return 1;
                    if (a.similarity > b.similarity) return -1;
                    return 0;
                  });

                  res.send({
                    results: arrayWithSimiliarity.slice(skip, skip + limit)
                  });
                }
              }

              loopCallback();
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
  }
});

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