const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { fork } = require("child_process");
const utils = require('/app/utils.js');

const PORT = 80;
const APIPREFIX = '/related';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


const sqlhelper = utils.sqlhelper;

sqlhelper.getConnection(
  function (mysqlConnection) {
    app.post(APIPREFIX + '/', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const skipMonstercatTracks = (req.query.skipMC === 'true');
        const tracks = req.body.tracks;
        const exclude = req.body.exclude;

        var gold = false;

        if (req.query.gold !== undefined) {
          gold = JSON.parse(req.query.gold);
        }

        getSearchFromIds(tracks, mysqlConnection, function (search) {
          utils.getTracksFromNotIds(mysqlConnection, [...search, ...exclude], skipMonstercatTracks, (result)=>{
            process.send({
              searchArray: search,
              sqlResult: result,
              gold: gold
            });

            process.on('message', (processResult) => {
              res.send(processResult);
            });
          }, (err)=>{
            console.log(err);
            res.send(err);
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
      const catalogSongQuery = 'SELECT id,search FROM `' + sqlhelper.dbName + '`.`catalog` WHERE id="' + trackArray[i].id + '";';

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
