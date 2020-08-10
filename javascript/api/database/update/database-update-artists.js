'use strict';

const request = require('request');
const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const dbName = 'monstercatDB';

const createDatabaseConnection = mysql.createConnection({
  host: 'mariadb',
  user: 'root',
  password: 'JacPV7QZ'
});

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

createDatabaseConnection.connect(err => {
  if (err) {
    console.log(err);
    return err;
  } else {
    createDatabaseConnection.query('CREATE DATABASE IF NOT EXISTS ' + dbName + ' DEFAULT CHARACTER SET "utf8" COLLATE "utf8_unicode_ci";', (err, result) => {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Created database/exists!');

        const sqlhelper = require('/app/api/sqlhelper.js');

        sqlhelper.getConnection(
          function (mysqlConnection) {
            initializeDatabase(mysqlConnection);
          },
          function (err) {
            console.log(err);
            return err;
          });
      }
    });
  }
});

function initializeDatabase(mysqlConnection) {
  const createArtistsTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`artists` ( `sortId` INT AUTO_INCREMENT, `id` VARCHAR(36), `about` TEXT, `bookingDetails` TEXT, `imagePositionX` INT, `imagePositionY` INT, `links` TEXT, `managementDetails` TEXT, `name` TEXT, `uri` TEXT, `years` TEXT, `search` TEXT, PRIMARY KEY(`id`), UNIQUE KEY(`sortId`));';
  mysqlConnection.query(createArtistsTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created artists table');

      app.post(APIPREFIX + '/artists', (req, res) => {
        addToDB(req.body, mysqlConnection, function(){
          res.send('OK');
        });
      });

      app.listen(PORT, () => {
        console.log('Server started on port ' + PORT);
      });
    }
  });
}

function addToDB(artist, mysqlConnection, callback) {
  artist.search = artist.id;
  artist.search += artist.uri;
  artist.search += artist.name;
  artist.search += artist.bookingDetails;
  artist.search += artist.managementDetails;
  artist.search += artist.links;

  var years = '';

  if (Array.isArray(artist.years)) {
    var years = artist.years[0];

    if (years !== undefined) {
      for (var k = 1; k < artist.years.length; k++) {
        years += ',' + artist.years[k];
      }
    } else {
      years = '';
    }

    var links = artist.links[0];

    if (links !== undefined) {
      for (var k = 1; k < artist.links.length; k++) {
        links += ',' + artist.links[k];
      }
    } else {
      links = '';
    }
  }

  //about can contain HTML -> convert to base64
  const about = Buffer.from(artist.about).toString('base64');
  const insertArtistQuery = 'REPLACE INTO `' + dbName + '`.`artists` (id, about, bookingDetails, imagePositionX, imagePositionY, links, managementDetails, name, uri, years, search) values ("' + artist.id + '","' + about + '","' + artist.bookingDetails + '","' + artist.imagePositionX + '","' + artist.imagePositionY + '","' + links + '","' + artist.managementDetails + '","' + artist.name + '","' + artist.uri + '","' + years + '","' + artist.search + '") ;';

  mysqlConnection.query(insertArtistQuery, (err, results) => {
    if (err) {
      console.log(err);
    }

    callback();
  });
}
