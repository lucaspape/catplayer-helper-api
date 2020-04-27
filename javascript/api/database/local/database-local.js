const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
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

    app.get(APIPREFIX + '/catalog/search', (req, res) => {
      var gold = false;

      if (req.query.gold !== undefined) {
        gold = JSON.parse(req.query.gold);
      }

      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const searchString = utils.fixSearchString(req.query.term)
        const terms = searchString.split(' ');

        const catalogSearchQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search FROM `' + dbName + '`.`catalog` WHERE search LIKE "%' + terms[0] + '%" ORDER BY debutDate DESC ' + ';';

        mysqlConnection.query(catalogSearchQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            var trackArray = result;

            for (var k = 1; k < terms.length; k++) {
              trackArray = trackArray.filter(track => new RegExp(terms[k], 'i').test(track.search));
            }

            for (var i = 0; i < trackArray.length; i++) {
              trackArray[i].similarity = utils.similarity(trackArray[i].search.replace(trackArray[i].id, ''), searchString);
            }

            trackArray.sort(function(a, b) {
              if (a.similarity < b.similarity) return 1;
              if (a.similarity > b.similarity) return -1;
              return 0;
            });

            trackArray = trackArray.slice(skip, skip + limit);

            var i = 0;

            var releasesQueryFinished = function() {
              if (i < trackArray.length) {
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
                  results: trackArray
                };

                res.send(returnObject);
              }
            };

            releasesQueryFinished();
          }
        });
      });
    });

    app.listen(PORT, () => {
      console.log('Server started on port ' + PORT);
    });
  }
});