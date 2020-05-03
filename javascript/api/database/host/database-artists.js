const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { fork } = require('child_process');
const utils = require('./utils.js');

const PORT = 80;
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

    app.get(APIPREFIX + '/artists', (req, res) => {
      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const artistsQuery = 'SELECT id, about, bookingDetails, imagePositionX, imagePositionY, links, managementDetails, name, uri, years FROM `' + dbName + '`.`artists` ORDER BY sortId DESC LIMIT ' + skip + ', ' + limit + ';';

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
      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const searchString = utils.fixSearchString(req.query.term)
        const terms = searchString.split(' ');

        const artistsSearchQuery = 'SELECT id, about, bookingDetails, imagePositionX, imagePositionY, links, managementDetails, name, uri, years, search FROM `' + dbName + '`.`artists` WHERE search LIKE "%' + terms[0] + '%" ORDER BY sortId DESC LIMIT ' + skip + ', ' + limit + ';';

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
  }
});