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
            inputString += search[i].search.replace(search[i].id, '').replace(/[^a-zA-Z]/g, '').trim() + ',';
            excludeString += search[i].id + ',';
          }

          if(exclude){
            for (var i = 0; i < exclude.length; i++) {
              excludeString += exclude[i].id + ',';
            }
          }

          if(skipMonstercatTracks){
            excludeString += 'monstercat'
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

            var catalogQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search FROM `' + dbName + '`.`catalog` WHERE id IN(';

            catalogQuery += '"' + out[0] + '"';

            for(var i=1; i<out.length; i++){
              catalogQuery += ',"' + out[i] + '"';
              array[i] = {id: out[i]};
            }

            catalogQuery += ') ORDER BY FIND_IN_SET(id, )'
            catalogQuery += '"' + out[0] + '"';

            for(var i=0; i<out.length; i++){
              catalogQuery += ',"' + out[i] + '"';
            }

            catalogQuery += ");"

            mysqlConnection.query(catalogQuery, (err, catalogResult) => {
              if (err) {
                res.send(err);
              } else {
                res.send({results: catalogResult, orig: array});
              }
            });

          //  res.send({results: array});
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
