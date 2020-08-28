const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require("child_process");
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

const sqlhelper = require('./sqlhelper.js');

sqlhelper.getConnection(
  function (mysqlConnection) {
    app.post(APIPREFIX + '/', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const skipMonstercatTracks = (req.query.skipMC === 'true');
        const tracks = req.body.tracks;
        const exclude = req.body.exclude;

        getSearchFromIds(tracks, mysqlConnection, function (search) {
          var excludeString = '';
          var inputString = '';

          for (var i = 0; i < search.length; i++) {
            inputString += search[i].id + ',';
            excludeString += search[i].id + ',';
          }

          if(exclude){
            for (var i = 0; i < exclude.length; i++) {
              excludeString += exclude[i].id + ',';
            }
          }

          var command = './calc /app/static/catalog-search.txt /app/static/catalog-ids.txt ' + inputString + ' ' + excludeString + ' ' + skip + ' ' + limit;

          console.log(command);

          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.log(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              console.log(`stderr: ${stderr}`);
              return;
            }

            var out = stdout.split(/\r?\n/);
            var array = [];

            for(var i=0; i<out.length(); i++){
              array[i] = {id: out[i]};
            }

            res.send({results: array});
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
