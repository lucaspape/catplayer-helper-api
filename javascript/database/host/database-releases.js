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

    app.get(APIPREFIX + '/releases', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const releasesQuery = 'SELECT * FROM `' + sqlhelper.dbName + '`.`releases` ORDER BY releaseDate DESC LIMIT ' + mysqlConnection.escape(skip) + ', ' + mysqlConnection.escape(limit) + ';';

        mysqlConnection.query(releasesQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            for (var i = 0; i < result.length; i++) {
              result[i] = utils.addMissingReleaseKeys(result[i]);
            }

            var returnObject = {
              results: result
            };

            res.send(returnObject);
          }
        });
      });
    });

    app.get(APIPREFIX + '/releases/search', (req, res) => {
      utils.fixSkipAndLimit(req.query, function (skip, limit) {
        const searchString = utils.fixSearchString(req.query.term)
        const terms = searchString.split(' ');

        const releasesSearchQuery = 'SELECT * FROM `' + sqlhelper.dbName + '`.`releases` WHERE search LIKE ' + mysqlConnection.escape('%' + terms[0] + '%') + ' ORDER BY releaseDate DESC;';

        mysqlConnection.query(releasesSearchQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            const process = fork('/app/api/processors/releases-processor.js');
            process.send({
              searchString: searchString,
              terms: terms,
              releaseArray: result,
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
  }, function (err) {
    console.log(err);
    return err;
  });
