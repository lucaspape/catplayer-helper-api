const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const request = require('request');
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

    const createArtistsTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`catalogReleases` ( `sortId` INT AUTO_INCREMENT PRIMARY KEY, `trackIds` TEXT, `releaseId` TEXT, `mcID` TEXT);';
    mysqlConnection.query(createArtistsTableQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Created catalog releases table');

        app.get(APIPREFIX + '/catalog/release/:mcID', (req, res) => {
          var gold = false;

          if (req.query.gold !== undefined) {
            gold = JSON.parse(req.query.gold);
          }

          const mcID = req.params.mcID;

          var getIdsQuery = 'SELECT trackIds, releaseId FROM `' + dbName + '`.`catalogReleases` WHERE mcID="' + mcID + '";';

          mysqlConnection.query(getIdsQuery, (err, result) => {
            if (err) {
              res.send(err);
            } else {
              if (result[0] === undefined) {
                getCatalogRelease(mcID, function(json) {
                    var releaseId = json.release.id;

                    var trackIds = json.tracks[0].id;
                    for (var i = 1; i < json.tracks.length; i++) {
                      trackIds += ',' + json.tracks[i].id;
                    }

                    var insertIdsQuery = 'INSERT INTO `' + dbName + '`.`catalogReleases` (trackIds, releaseId, mcID) values ("' + trackIds + '","' + releaseId + '","' + mcID + '");';

                    mysqlConnection.query(insertIdsQuery, (err, result) => {
                      if (err) {
                        res.send(err);
                      } else {
                        getFromDB(releaseId, trackIds, gold, function(responseObject) {
                          res.send(responseObject);
                        }, function(err) {
                          res.send(err);
                        });
                      }
                    });
                  },
                  function(err) {
                    res.send(err);
                  })
              } else {
                var releaseId = result[0].releaseId;
                var trackIds = result[0].trackIds.split(',');

                getFromDB(releaseId, trackIds, gold, function(responseObject) {
                  res.send(responseObject);
                }, function(err) {
                  res.send(err);
                });
              }
            }
          });

        });

        app.listen(PORT, () => {
          console.log('Server started on port ' + PORT);
        });
      }
    });
  }
});

function getFromDB(releaseId, trackIds, gold, callback, errorCallback) {
  getRelease(releaseId, function(release) {
    getTracks(trackIds, gold, function(tracks) {
      callback({
        release: release,
        tracks: tracks
      })
    }, function(err) {
      errorCallback(err);
    })
  }, function(err) {
    errorCallback(err);
  });
}

function getTracks(trackIdArray, gold, callback, errorCallback) {
  var trackArray = [];
  var i = 0;

  var sqlCallback = function() {
    if (i < trackIdArray.length) {
      const catalogId = trackIdArray[i];
      const catalogQuery = 'SELECT catalog.id,artists,catalog.artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,catalog.genrePrimary,catalog.genreSecondary,isrc,playlistSort,releaseId,tags,catalog.title,trackNumber,catalog.version,inEarlyAccess FROM `' + dbName + '`.`catalog`' + ' WHERE id="' + catalogId + '";';

      mysqlConnection.query(catalogQuery, (err, result) => {
        if (err) {
          errorCallback(err);
        } else {
          addMissingTrackKeys(result, gold, mysqlConnection, function(track) {
            trackArray[i] = track;
            i++;
            sqlCallback();
          }, function(err) {
            errorCallback(err);
          });
        }
      });
    } else {
      callback(trackArray);
    }
  }

  sqlCallback();
}

function getRelease(releaseId, callback, errorCallback) {
  var getReleaseQuery = 'SELECT id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version FROM `' + dbName + '`.`releases` WHERE id="' + releaseId + '";';

  mysqlConnection.query(getReleaseQuery, (err, result) => {
    if (err) {
      errorCallback(err);
    } else {
      callback(result);
    }
  });
}

function addMissingTrackKeys(track, gold, mysqlConnection, callback, errorCallback) {
  if (track.inEarlyAccess === 'true') {
    track.downloadable = false;
    track.streamable = gold;
  } else {
    track.streamable = true;
    track.downloadable = gold;
  }

  if (track.tags !== undefined) {
    const tags = track.tags.split(',');
    track.tags = [];

    for (var i = 0; i < tags.length; i++) {
      track.tags[i] = tags[i];
    }
  }

  if (track.artists !== undefined) {
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
  } else {
    callback(track);
  }
}

function getCatalogRelease(mcID, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/catalog/release/' + mcID,
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