'use strict';

const request = require('request');
const mysql = require('mysql');
const sqlhelper = require('/app/sqlhelper.js');

sqlhelper.getConnectionWitoutSelectedDB.connect(err => {
  if (err) {
    console.log(err);
    return err;
  } else {
    createDatabaseConnection.query('CREATE DATABASE IF NOT EXISTS ' + sqlhelper.dbName + ' DEFAULT CHARACTER SET "utf8" COLLATE "utf8_unicode_ci";', (err, result) => {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Created database/exists!');

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
  const createArtistsTableQuery = 'CREATE TABLE IF NOT EXISTS `' + sqlhelper.dbName + '`.`artists` ( `sortId` INT AUTO_INCREMENT, `id` VARCHAR(36), `about` TEXT, `bookingDetails` TEXT, `imagePositionX` INT, `imagePositionY` INT, `links` TEXT, `managementDetails` TEXT, `name` TEXT, `uri` TEXT, `years` TEXT, `search` TEXT, PRIMARY KEY(`id`), UNIQUE KEY(`sortId`));';
  mysqlConnection.query(createArtistsTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created artists table');

      initArtists(mysqlConnection, function () {
        console.log('Done!');

        //wait 5 minutes
        setTimeout(function () {
          initializeDatabase(mysqlConnection);
        }, 300000);
      });
    }
  });
}

function initArtists(mysqlConnection, callback) {
  browseArtists(-1, 0,
    function (json) {
      console.log('Received artists data...');
      const artistsArray = json.results.reverse();

      var i = 0;

      var sqlCallback = function () {
        if (i < artistsArray.length) {
          if (i % 100 === 0) {
            console.log((i / artistsArray.length) * 100 + '%');
          }

          addToDB(artistsArray[i], mysqlConnection, function () {
            i++;
            sqlCallback();
          });
        } else {
          callback();
        }
      };

      sqlCallback();
    },
    function (err) {
      console.log(err);
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
  const insertArtistQuery = 'REPLACE INTO `' + sqlhelper.dbName + '`.`artists` (id, about, bookingDetails, imagePositionX, imagePositionY, links, managementDetails, name, uri, years, search) values ("' + artist.id + '","' + about + '","' + artist.bookingDetails + '","' + artist.imagePositionX + '","' + artist.imagePositionY + '","' + links + '","' + artist.managementDetails + '","' + artist.name + '","' + artist.uri + '","' + years + '","' + artist.search + '") ;';

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
    function (err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        callback(JSON.parse(body));
      }
    });
}
