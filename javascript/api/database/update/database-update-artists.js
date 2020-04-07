const request = require('request');
const fs = require('fs');
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
        console.log(result);
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
            initializeDatabase();
          }
        });
      }
    });
  }
});

function initializeDatabase() {
  const createArtistsTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`artists` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `id` TEXT, `about` TEXT, `bookingDetails` TEXT, `imagePositionX` INT, `imagePositionY` INT, `links` TEXT, `managementDetails` TEXT, `name` TEXT, `uri` TEXT, `years` TEXT, `search` TEXT);';
  mysqlConnection.query(createArtistsTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created artists table');

      initArtists(function() {
        console.log('Done!');
      });
    }
  });
}

function initArtists(callback) {
  browseArtists(-1, 0,
    function(json) {
      console.log('Received artists data...');
      const total = json.total;

      for (var i = 0; i < json.results.length; i++) {
        if (i % 100 === 0) {
          console.log((i / total) * 100 + '%');
        }

        var artist = json.results[i];
        artist.sortId = i;

        artist.search = artist.id;
        artist.search += artist.uri;
        artist.search += artist.name;
        artist.search += artist.about;
        artist.search += artist.bookingDetails;
        artist.search += artist.managementDetails;
        artist.search += artist.links;

        const insertArtistQuery = 'INSERT INTO `' + dbName + '`.`artists` (id, about, bookingDetails, imagePositionX, imagePositionY, links, managementDetails, name, uri, years, search) values ("' + artist.id + '","' + artist.about + '","' + artist.bookingDetails + '","' + artist.imagePositionX + '","' + artist.imagePositionY + '","' + artist.links + '","' + artist.managementDetails + '","' + artist.name + '","' + artist.uri + '","' + artist.years + '","' + artist.search + '");';

        mysqlConnection.query(insertArtistQuery, (err, results) => {
          if (err) {
            console.log(err);
          }
        });
      }
      callback();
    },

    function(err) {
      console.log(err);
    });

}

function browseArtists(limit, skip, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/artists?limit=' + limit + '&skip=' + skip,
      method: 'GET'
    },
    function(err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        callback(JSON.parse(body));
      }
    });
}