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
  const createReleasesTableQuery = 'CREATE OR REPLACE TABLE `' + dbName + '`.`releases` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `id` TEXT, `catalogId` TEXT, `artistsTitle` TEXT, `genrePrimary` TEXT, `genreSecondary` TEXT, `links` TEXT, `releaseDate` TEXT, `title` TEXT, `type` TEXT, `version` TEXT, `search` TEXT);'
  mysqlConnection.query(createReleasesTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created releases table');

      initReleases(mysqlConnection, function() {
        console.log('Done!');
      });
    }
  });
}

function initReleases(mysqlConnection, callback) {
  browseReleases(-1, 0,
    function(json) {
      console.log('Received release data...');
      const total = json.total;

      for (var i = 0; i < json.results.length; i++) {
        if (i % 100 === 0) {
          console.log((i / total) * 100 + '%');
        }

        var release = json.results[i];
        release.sortId = i;

        release.search = release.artistsTitle;
        release.search += release.catalogId;
        release.search += release.genrePrimary;
        release.search += release.genreSecondary;
        release.search += release.title;
        release.search += release.version;
        release.search += release.id;

        const insertReleaseQuery = 'INSERT INTO `' + dbName + '`.`releases` (id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version,search) values ("' + release.id + '","' + release.catalogId + '","' + release.artistsTitle + '","' + release.genrePrimary + '","' + release.genreSecondary + '","' + JSON.stringify(release.links).replace('"', "''") + '","' + release.releaseDate + '","' + release.title + '","' + release.type + '","' + release.version + '","' + release.search + '");';

        mysqlConnection.query(insertReleaseQuery, (err, results) => {
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

function browseReleases(limit, skip, callback, errorCallback) {
  request({
      url: 'https://connect.monstercat.com/v2/releases?limit=' + limit + '&skip=' + skip,
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