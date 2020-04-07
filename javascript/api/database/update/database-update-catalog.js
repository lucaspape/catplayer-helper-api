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
  const createCatalogTableQuery = 'CREATE OR REPLACE TABLE `' + dbName + '`.`catalog` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `id` TEXT, `artists` TEXT, `artistsTitle` TEXT, `bpm` INT, `creatorFriendly` TEXT, `debutDate` TEXT, `duration` INT, `explicit` TEXT, `genrePrimary` TEXT, `genreSecondary` TEXT, `isrc` TEXT, `playlistSort` INT, `releaseId` TEXT, `tags` TEXT, `title` TEXT, `trackNumber` INT, `version` TEXT, `search` TEXT);'
  mysqlConnection.query(createCatalogTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created catalog table');

      initCatalog(mysqlConnection, function() {
        console.log('Done!');
      });
    }
  });
}

function initCatalog(mysqlConnection, callback) {
  browseTracks(-1, 0,
    function(json) {
      console.log('Received catalog data...');
      const total = json.total;

      for (var i = 0; i < json.results.length; i++) {
        if (i % 100 === 0) {
          console.log((i / total) * 100 + '%');
        }

        var track = json.results[i];
        track.sortId = i;

        track.search = track.artistsTitle;
        track.search += track.genrePrimary;
        track.search += track.genreSecondary;
        track.search += track.id;
        track.search += track.release.artistsTitle;
        track.search += track.release.catalogId;
        track.search += track.release.id;
        track.search += track.title;
        track.search += track.version;

        for (var k = 0; k < track.tags.length; k++) {
          track.search += track.tags[k];
        }

        for (var k = 0; k < track.artists.length; k++) {
          track.search += track.artists[k].name;
        }

        const insertTrackQuery = 'INSERT INTO `' + dbName + '`.`catalog` (id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,mcRelease,tags,title,trackNumber,version,search) values ("' + track.id + '","' + JSON.stringify(track.artists).replace('"', "''") + '","' + track.artistsTitle + '","' + track.bpm + '","' + track.creatorFriendly + '","' + track.debutDate + '","' + track.duration + '","' + track.explicit + '","' + track.genrePrimary + '","' + track.genreSecondary + '","' + track.isrc + '","' + track.playlistSort + '","' + track.release.id + '","' + JSON.stringify(track.tags).replace('"', "''") + '","' + track.title + '","' + track.trackNumber + '","' + track.version + '","' + track.search + '");'

        mysqlConnection.query(insertTrackQuery, (err, results) => {
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

function browseTracks(limit, skip, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/catalog/browse?limit=' + limit + '&skip=' + skip,
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