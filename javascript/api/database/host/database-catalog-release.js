const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const utils = require('./utils.js');

const PORT = 80;
const APIPREFIX = '';

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
    console.log('Connected to database!');

    const createCatalogReleasesQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`catalogReleases` (`trackIds` TEXT, `releaseId` TEXT, `mcID` VARCHAR(36), PRIMARY KEY(`mcID`));';
    mysqlConnection.query(createCatalogReleasesQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Created catalog releases table');

        app.post(APIPREFIX + '/catalog/release/:catalogID', (req, res) => {
          const catalogID = req.params.catalogID;

          const tracks = req.body.tracks;
          const releaseId = req.body.releaseId;

          insertTracks(releaseId, catalogID, tracks, () =>{
            res.status(200).send('OK');
          }, (err)=>{
            res.status(500).send(err);
          });
        });

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
                res.status(404).send('Not found');
              } else {
                var releaseId = result[0].releaseId;
                var trackIds = result[0].trackIds.split(',');

                getFromDB(mysqlConnection, releaseId, trackIds, gold, function(responseObject) {
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
  }, function (err) {
    console.log(err);
    return err;
  });

function getFromDB(mysqlConnection, releaseId, trackIds, gold, callback, errorCallback) {
  getRelease(mysqlConnection, releaseId, function(release) {
    getTracks(mysqlConnection, trackIds, gold, release, function(tracks) {
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

function getTracks(mysqlConnection,trackIdArray, gold, releaseObject, callback, errorCallback) {
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
          utils.addMissingTrackKeys(result[0], gold, releaseObject, mysqlConnection, function(track) {
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

function getRelease(mysqlConnection, releaseId, callback, errorCallback) {
  var getReleaseQuery = 'SELECT id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version FROM `' + dbName + '`.`releases` WHERE id="' + releaseId + '";';

  mysqlConnection.query(getReleaseQuery, (err, result) => {
    if (err) {
      errorCallback(err);
    } else {
      callback(utils.addMissingReleaseKeys(result[0]));
    }
  });
}

function insertTracks(releaseId, catalogId, tracks, callback, errorCallback ){
  for (var i = 1; i < tracks.length; i++) {
    trackIds += ',' + tracks[i].id;
  }

  var insertIdsQuery = 'INSERT INTO `' + dbName + '`.`catalogReleases` (trackIds, releaseId, mcID) values ("' + trackIds + '","' + releaseId + '","' + catalogId + '");';

  mysqlConnection.query(insertIdsQuery, (err, result) => {
    if (err) {
        errorCallback(err);
    } else {
        callback();
    }
  });
}
