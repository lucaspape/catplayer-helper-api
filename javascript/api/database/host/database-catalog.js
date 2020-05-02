const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { fork } = require('child_process');
const utils = require('./utils.js');

const PORT = 80;
const APIPREFIX = '';
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
    console.log('Connected to database!');

    app.get(APIPREFIX + '/catalog', (req, res) => {
      var gold = false;

      if (req.query.gold !== undefined) {
        gold = JSON.parse(req.query.gold);
      }

      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const catalogQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess FROM `' + dbName + '`.`catalog`' + 'ORDER BY debutDate DESC LIMIT ' + skip + ', ' + limit + ';';

        mysqlConnection.query(catalogQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            var trackArray = result;
            var i = 0;

            var releasesQueryFinished = function() {
              if (i < result.length) {
                const releaseQuery = 'SELECT artistsTitle, catalogId, id, releaseDate, title, type FROM `' + dbName + '`.`releases` WHERE id="' + trackArray[i].releaseId + '";';

                mysqlConnection.query(releaseQuery, (err, releaseResult) => {
                  if (err) {
                    res.send(err);
                  } else {
                    utils.addMissingTrackKeys(trackArray[i], gold, releaseResult[0], mysqlConnection, function(track) {
                      trackArray[i] = track;
                      i++;
                      releasesQueryFinished();
                    }, function(err) {
                      res.send(err);
                    });

                  }
                });
              } else {
                var returnObject = {
                  results: result
                };

                res.send(returnObject);
              }
            };

            releasesQueryFinished();
          }
        });
      });
    });

    app.get(APIPREFIX + '/catalog/search', (req, res) => {
      var gold = false;

      if (req.query.gold !== undefined) {
        gold = JSON.parse(req.query.gold);
      }

      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const searchString = utils.fixSearchString(req.query.term)
        const terms = searchString.split(' ');

        const catalogSearchQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search FROM `' + dbName + '`.`catalog` WHERE search LIKE "%' + terms[0] + '%" ORDER BY debutDate DESC ' + ';';

        mysqlConnection.query(catalogSearchQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            const process = fork('/app/api/database/host/catalog-processor.js');
            process.send({
              terms: terms,
              trackArray: trackArray,
              mysqlConnection: mysqlConnection
            });

            process.on('message', (processResult) => {
              res.send(processResult);
            });
          }
        });
      });
    });

    app.listen(PORT, () => {
      console.log('Server started on port ' + PORT);
    });
  }
});