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

const createDatabaseConnection = mysql.createConnection({
  host: 'mariadb',
  user: 'root',
  password: 'JacPV7QZ'
});

createDatabaseConnection.connect(err => {
  if (err) {
    console.log(err);
    return err;
  } else {
    createDatabaseConnection.query('CREATE DATABASE IF NOT EXISTS ' + dbName, (err, result) => {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Created database/exists!');

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
              utils.fixSkipAndLimit(req.query, function(skip, limit) {
                const catalogQuery = 'SELECT catalog.id,artists,catalog.artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,catalog.genrePrimary,catalog.genreSecondary,isrc,playlistSort,releaseId,tags,catalog.title,trackNumber,catalog.version FROM `' + dbName + '`.`catalog`' + 'ORDER BY catalog.sortId ASC LIMIT ' + skip + ', ' + limit + ';';

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
                            console.log(releaseResult);
                            trackArray[i].release = releaseResult[0];
                            i++;
                            queryFinished();
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
              utils.fixSkipAndLimit(req.query, function(skip, limit) {
                const searchString = utils.fixSearchString(req.query.term)
                const terms = searchString.split(' ');

                const catalogSearchQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version FROM `' + dbName + '`.`catalog` WHERE search LIKE "%' + terms[0] + '%" ORDER BY sortId ASC LIMIT ' + skip + ', ' + limit + ';';

                mysqlConnection.query(catalogSearchQuery, (err, result) => {
                  if (err) {
                    res.send(err);
                  } else {
                    var trackArray = result;

                    for (var k = 1; k < terms.length; k++) {
                      trackArray = trackArray.filter(track => new RegExp(terms[k], 'i').test(track.search));
                    }

                    for (var i = 0; i < trackArray.length; i++) {
                      trackArray[i].similarity = utils.similarity(trackArray[i].search, searchString);
                    }

                    trackArray = trackArray.sort((a, b) => (a.similarity - b.similarity)).reverse();

                    var i = 0;

                    var releasesQueryFinished = function() {
                      if (i < trackArray.length) {
                        const releaseQuery = 'SELECT artistsTitle, catalogId, id, releaseDate, title, type FROM `' + dbName + '`.`releases` WHERE id="' + trackArray[i].releaseId + '";';

                        mysqlConnection.query(releaseQuery, (err, releaseResult) => {
                          if (err) {
                            res.send(err);
                          } else {
                            console.log(releaseResult);
                            trackArray[i].release = releaseResult[0];
                            i++;
                            queryFinished();
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

            app.listen(PORT, () => {
              console.log('Server started on port ' + PORT);
            });
          }
        });
      }
    });
  }
});