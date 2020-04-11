const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
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

    app.get(APIPREFIX + '/releases', (req, res) => {
      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const releasesQuery = 'SELECT id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version FROM `' + dbName + '`.`releases` ORDER BY sortId DESC LIMIT ' + skip + ', ' + limit + ';';

        mysqlConnection.query(releasesQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            for (var i = 0; i < result.length; i++) {
              result[i] = addMissingKeys(result[i]);
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
      utils.fixSkipAndLimit(req.query, function(skip, limit) {
        const searchString = utils.fixSearchString(req.query.term)
        const terms = searchString.split(' ');

        const releasesSearchQuery = 'SELECT id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version,search FROM `' + dbName + '`.`releases` WHERE search LIKE "%' + terms[0] + '%" ORDER BY sortId DESC;';

        mysqlConnection.query(releasesSearchQuery, (err, result) => {
          if (err) {
            res.send(err);
          } else {
            var releaseArray = result;

            for (var k = 1; k < terms.length; k++) {
              releaseArray = releaseArray.filter(release => new RegExp(terms[k], 'i').test(release.search));
            }

            for (var i = 0; i < releaseArray.length; i++) {
              releaseArray[i].similarity = utils.similarity(releaseArray[i].search, searchString);
            }

            releaseArray = releaseArray.sort((a, b) => (a.similarity - b.similarity)).reverse();

            releaseArray = releaseArray.slice(skip, skip + limit);

            for (var i = 0; i < releaseArray.length; i++) {
              releaseArray[i] = addMissingKeys(releaseArray[i]);
            }

            const returnObject = {
              results: releaseArray
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

function addMissingKeys(release) {
  if (release.links.length > 0) {
    release.links = release.links.split(',');
  }

  return release;
}