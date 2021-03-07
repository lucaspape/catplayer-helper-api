const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const utils = require('/app/utils.js');

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const sqlhelper = utils.sqlhelper;

sqlhelper.getConnection(
  function (mysqlConnection) {
    console.log('Connected to database!');

    const createCatalogReleasesQuery = 'CREATE TABLE IF NOT EXISTS `' + sqlhelper.dbName + '`.`catalogReleases` (`trackIds` TEXT, `releaseId` TEXT, `mcID` VARCHAR(36), PRIMARY KEY(`mcID`));';
    mysqlConnection.query(createCatalogReleasesQuery, (err, result) => {
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

          getCatalogRelease(mysqlConnection, mcID, gold, (result)=>{
            res.send(result);
          }, (err)=>{
            res.send(err);
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

function getCatalogRelease(mysqlConnection, mcID, gold, callback, errorCallback){
  var getIdsQuery = 'SELECT trackIds, releaseId FROM `' + sqlhelper.dbName + '`.`catalogReleases` WHERE mcID="' + mysqlConnection.escape(mcID) + '";';

  mysqlConnection.query(getIdsQuery, (err, result) => {
    if (err) {
      errorCallback(err);
    } else {
      if (result[0] === undefined) {
        getRemoteCatalogRelease(mcID, function(json) {
            var releaseId = json.release.id;

            var trackIds = json.tracks[0].id;
            for (var i = 1; i < json.tracks.length; i++) {
              trackIds += ',' + json.tracks[i].id;
            }

            var insertIdsQuery = 'INSERT INTO `' + sqlhelper.dbName + '`.`catalogReleases` (trackIds, releaseId, mcID) values ("' + trackIds + '","' + releaseId + '","' + mysqlConnection.escape(mcID) + '");';

            mysqlConnection.query(insertIdsQuery, (err, result) => {
              if (err) {
                res.send(err);
              } else {
                getFromDB(mysqlConnection,releaseId, trackIds.split(','), gold, function(responseObject) {
                  callback(responseObject);
                }, function(err) {
                  errorCallback(err);
                });
              }
            });
          },
          function(err) {
            errorCallback(err);
          })
      } else {
        var releaseId = result[0].releaseId;
        var trackIds = result[0].trackIds.split(',');

        getFromDB(mysqlConnection, releaseId, trackIds, gold, function(responseObject) {
          callback(responseObject);
        }, function(err) {
          errorCallback(err);
        });
      }
    }
  });
}

function getFromDB(mysqlConnection, releaseId, trackIds, gold, callback, errorCallback) {
  utils.getRelease(mysqlConnection, releaseId, function(release) {
    utils.getTracksFromIds(mysqlConnection, trackIds, gold, release, function(tracks) {
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

function getRemoteCatalogRelease(mcID, callback, errorCallback) {
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
