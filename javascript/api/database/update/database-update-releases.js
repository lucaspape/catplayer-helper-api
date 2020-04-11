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
  const createReleasesTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`releases` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `id` TEXT, `catalogId` TEXT, `artistsTitle` TEXT, `genrePrimary` TEXT, `genreSecondary` TEXT, `links` TEXT, `releaseDate` TEXT, `title` TEXT, `type` TEXT, `version` TEXT, `search` TEXT);'
  mysqlConnection.query(createReleasesTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created releases table');

      initReleases(mysqlConnection, function() {
        console.log('Done!');

        //wait 5 minutes
        setTimeout(function() {
          initializeDatabase(mysqlConnection);
        }, 300000);
      });
    }
  });
}

function initReleases(mysqlConnection, callback) {
  browseReleases(-1, 0,
    function(json) {
      console.log('Received release data...');
      const releasesArray = json.results.reverse();

      var i = 0;

      var sqlCallback = function() {
        if (i < releasesArray.length) {
          if (i % 100 === 0) {
            console.log((i / releasesArray.length) * 100 + '%');
          }

          addToDB(releasesArray[i], mysqlConnection, function() {
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

function addToDB(release, mysqlConnection, callback) {
  release.search = release.artistsTitle;
  release.search += release.catalogId;
  release.search += release.genrePrimary;
  release.search += release.genreSecondary;
  release.search += release.title;
  release.search += release.version;
  release.search += release.id;

  const insertReleaseQuery = 'INSERT INTO `' + dbName + '`.`releases` (id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version,search) values ("' + release.id + '","' + release.catalogId + '","' + release.artistsTitle + '","' + release.genrePrimary + '","' + release.genreSecondary + '","' + JSON.stringify(release.links).replace('"', "''") + '","' + release.releaseDate + '","' + release.title + '","' + release.type + '","' + release.version + '","' + release.search + '") ON DUPLICATE KEY UPDATE id="' + release.id + '";';

  mysqlConnection.query(insertReleaseQuery, (err, results) => {
    if (err) {
      console.log(err);
    }

    callback();
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