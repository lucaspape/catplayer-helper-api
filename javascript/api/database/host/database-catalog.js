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

    app.get(APIPREFIX + '/catalog', (req, res) => {
      var gold = false;

      if (req.query.gold !== undefined) {
        gold = req.query.gold;
      }

      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const catalogQuery = 'SELECT catalog.id,artists,catalog.artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,catalog.genrePrimary,catalog.genreSecondary,isrc,playlistSort,releaseId,tags,catalog.title,trackNumber,catalog.version,inEarlyAccess FROM `' + dbName + '`.`catalog`' + 'ORDER BY catalog.sortId ASC LIMIT ' + skip + ', ' + limit + ';';

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
                    trackArray[i].release = releaseResult[0];
                    addMissingKeys(trackArray[i], gold, mysqlConnection, function(track) {
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
        gold = req.query.gold;
      }

      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const searchString = utils.fixSearchString(req.query.term)
        const terms = searchString.split(' ');

        const catalogSearchQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search FROM `' + dbName + '`.`catalog` WHERE search LIKE "%' + terms[0] + '%" ORDER BY sortId ASC ' + ';';

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
                    trackArray[i].release = releaseResult[0];
                    addMissingKeys(trackArray[i], gold, mysqlConnection, function(track) {
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
                  results: trackArray.slice(skip, skip + limit)
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

function addMissingKeys(track, gold, mysqlConnection, callback, errorCallback) {
  console.log(gold);

  if (track.inEarlyAccess) {
    track.downloadable = false;

    if (gold === true) {
      track.streamable = true;
    } else {
      track.streamable = false;
    }
  } else {
    track.streamable = true;

    if (gold === true) {
      track.downloadable = true;
    } else {
      track.downloadable = false;
    }
  }

  console.log(track);

  const tags = track.tags.split(',');
  track.tags = [];

  for (var i = 0; i < tags.length; i++) {
    track.tags[i] = tags[i];
  }

  var artistArray = [];
  const artists = track.artists.split(',');

  var i = 0;

  var sqlCallback = function() {
    if (i < artists.length) {
      const artistQuery = 'SELECT id,name FROM `' + dbName + '`.`artists` WHERE artists.id="' + artists[i] + '";';

      mysqlConnection.query(artistQuery, (err, artistResults) => {
        if (err) {
          errorCallback(err);
        } else {
          artistArray[i] = artistResults[0];

          i++;
          sqlCallback();
        }
      });

    } else {
      track.artists = artistArray;
      callback(track);
    }
  };

  sqlCallback();
}