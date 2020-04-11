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
            initializeDatabase(mysqlConnection);
          }
        });
      }
    });
  }
});

function initializeDatabase(mysqlConnection) {
  const createArtistsTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`artists` ( `sortId` INT AUTO_INCREMENT PRIMARY KEY, `id` TEXT, `about` TEXT, `bookingDetails` TEXT, `imagePositionX` INT, `imagePositionY` INT, `links` TEXT, `managementDetails` TEXT, `name` TEXT, `uri` TEXT, `years` TEXT, `search` TEXT);';
  mysqlConnection.query(createArtistsTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created artists table');

      initArtists(mysqlConnection, function() {
        console.log('Done!');

        //wait 5 minutes
        setTimeout(function() {
          initializeDatabase(mysqlConnection);
        }, 300000);
      });
    }
  });
}

function initArtists(mysqlConnection, callback) {
  browseArtists(-1, 0,
    function(json) {
      console.log('Received artists data...');
      const artistsArray = json.results.reverse();

      var i = 0;

      var sqlCallback = function() {
        if (i < artistsArray.length) {
          if (i % 100 === 0) {
            console.log((i / artistsArray.length) * 100 + '%');
          }

          addToDB(artistsArray[i], mysqlConnection, function() {
            i++;
            sqlCallback();
          });
        } else {
          callback();
        }
      };

      sqlCallback();
    },
    function(err) {
      console.log(err);
    });

}

function addToDB(artist, mysqlConnection, callback) {
  artist.search = artist.id;
  artist.search += artist.uri;
  artist.search += artist.name;
  artist.search += artist.about;
  artist.search += artist.bookingDetails;
  artist.search += artist.managementDetails;
  artist.search += artist.links;

  const insertArtistQuery = 'INSERT INTO `' + dbName + '`.`artists` (id, about, bookingDetails, imagePositionX, imagePositionY, links, managementDetails, name, uri, years, search) values ("' + artist.id + '","' + artist.about + '","' + artist.bookingDetails + '","' + artist.imagePositionX + '","' + artist.imagePositionY + '","' + JSON.stringify(artist.links).replace('"', "''") + '","' + artist.managementDetails + '","' + artist.name + '","' + artist.uri + '","' + JSON.stringify(artist.years).replace('"', "''") + '","' + artist.search + '") ON DUPLICATE KEY UPDATE id="' + artist.id + '";';

  mysqlConnection.query(insertArtistQuery, (err, results) => {
    if (err) {
      console.log(err);
    }

    callback();
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