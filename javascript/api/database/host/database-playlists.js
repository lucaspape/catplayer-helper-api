const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const request = require('request');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

const dbName = 'monstercatDB';

const sqlhelper = require('/app/api/sqlhelper.js');

sqlhelper.getConnection(
  function (mysqlConnection) {
    console.log('Connected to database!');

    const createSessionTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`playlists` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `playlistName` TEXT, `playlistId` TEXT UNIQUE KEY, `userId` TEXT, `public` TEXT);'

    mysqlConnection.query(createSessionTableQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        app.get(APIPREFIX + '/playlists', (req, res) => {
          const userId = req.query.userId;
          const playlistsQuery = 'SELECT playlistId,userId,public FROM `' + dbName + '`.`catalog`' + 'ORDER BY sortId DESC WHERE userId="' + userId + '";';

          mysqlConnection.query(playlistsQuery, (err, results) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.status(200).send({
                results: results
              });
            }
          });
        });

        app.get(APIPREFIX + '/playlist', (req, res) => {

        });

        app.post(APIPREFIX + '/playlist', (req, res) => {

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
