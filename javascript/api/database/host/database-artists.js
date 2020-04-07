const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const mysql = require('mysql');

const dbName = 'monstercatDB';

const createDatabaseConnection = mysql.createConnection({
  host: 'mariadb',
  user: 'root',
  password: 'JacPV7QZ'
});

createDatabaseConnection.connect(err => {
  if (err) {
    console.log(err);
    return err;
  } else {
    createDatabaseConnection.query('CREATE DATABASE IF NOT EXISTS ' + dbName, (err, result) => {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Created database/exists!');

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
                const artistsQuery = 'SELECT * FROM `' + dbName + '`.`artists` ORDER BY sortId ASC LIMIT ' + skip + ', ' + limit + ';';

                mysqlConnection.query(artistsQuery, (err, result) => {
                  if (err) {
                    res.send(err);
                  } else {
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

                const artistsSearchQuery = 'SELECT * FROM `' + dbName + '`.`artists` ORDER BY sortId ASC LIMIT ' + skip + ', ' + limit + ' WHERE search LIKE "%' + terms[0] + '%";';

                mysqlConnection.query(artistsSearchQuery, (err, result) => {
                  if (err) {
                    res.send(err);
                  } else {
                    var artistsArray = JSON.parse(results);

                    for (var k = 1; k < terms.length; k++) {
                      artistsArray = artistsArray.filter(artist => new RegExp(terms[k], 'i').test(artist.search));
                    }

                    for (var i = 0; i < artistsArray.length; i++) {
                      artistsArray[i].similarity = utils.similarity(artistsArray[i].search, searchString);
                    }

                    artistsArray = artistsArray.sort((a, b) => (a.similarity - b.similarity)).reverse();

                    const returnObject = {
                      results: artistsArray.slice(skip, skip + limit)
                    }

                    res.send(returnObject);
                  }
                });
              });
            });

            app.listen(PORT, () => {
              console.log('Server started on port ' + PORT);
            });
          }
        });
      }
    });
  }
});