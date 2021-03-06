const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { fork } = require('child_process');
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

    app.get(APIPREFIX + '/artists', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const artistsQuery = 'SELECT * FROM `' + sqlhelper.dbName + '`.`artists` ORDER BY sortId DESC LIMIT ' + mysqlConnection.escape(skip) + ', ' + mysqlConnection.escape(limit) + ';';

        mysqlConnection.query(artistsQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            for (var i = 0; i < result.length; i++) {
              result[i] = utils.addMissingArtistKeys(result[i]);
            }

            var returnObject = {
              results: result
            };

            res.send(returnObject);
          }
        });
      });
    });

    app.get(APIPREFIX + '/artists/search', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const searchString = req.query.term;
        const terms = searchString.split(' ');

        const artistsSearchQuery = 'SELECT * FROM `' + sqlhelper.dbName + '`.`artists` WHERE search LIKE ' + mysqlConnection.escape('%' + terms[0] + '%') + ' ORDER BY sortId DESC LIMIT ' + mysqlConnection.escape(skip) + ', ' + mysqlConnection.escape(limit) + ';';

        mysqlConnection.query(artistsSearchQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            const process = fork('/app/api/processors/artist-processor.js');
            process.send({
              searchString: searchString,
              terms: terms,
              artistsArray: result,
              skip: skip,
              limit: limit
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
  },
  function (err) {
    console.log(err);
    return err;
  });
