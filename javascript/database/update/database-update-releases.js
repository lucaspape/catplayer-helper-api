const request = require('request');

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
    createDatabaseConnection.query('CREATE DATABASE IF NOT EXISTS ' + dbName + ' DEFAULT CHARACTER SET "utf8" COLLATE "utf8_unicode_ci";', (err, result) => {
      if (err) {
        console.log(err);
        return err;
      } else {
        console.log('Created database/exists!');

        const sqlhelper = require('/app/sqlhelper.js');

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
  const createReleasesTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`releases` (`id` VARCHAR(36), `catalogId` TEXT, `artistsTitle` TEXT, `genrePrimary` TEXT, `genreSecondary` TEXT, `links` TEXT, `releaseDate` DATE, `releaseTime` TEXT, `title` TEXT, `type` TEXT, `version` TEXT, `search` TEXT, PRIMARY KEY(`id`));'
  mysqlConnection.query(createReleasesTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created releases table');

      initReleases(mysqlConnection, function () {
        console.log('Done!');

        //wait 5 minutes
        setTimeout(function () {
          initializeDatabase(mysqlConnection);
        }, 300000);
      });
    }
  });
}

function initReleases(mysqlConnection, callback) {
  browseReleases(-1, 0,
    function (json) {
      console.log('Received release data...');
      const releasesArray = json.results.reverse();

      var i = 0;

      var sqlCallback = function () {
        if (i < releasesArray.length) {
          if (i % 100 === 0) {
            console.log((i / releasesArray.length) * 100 + '%');
          }

          addToDB(releasesArray[i], mysqlConnection, function () {
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

function addToDB(release, mysqlConnection, callback) {
  release.search = release.artistsTitle;
  release.search += release.catalogId;
  release.search += release.genrePrimary;
  release.search += release.genreSecondary;
  release.search += release.title;
  release.search += release.version;
  release.search += release.id;

  var links = '';

  if(release.links) {
    links = release.links[0];

    for (var k = 1; k < release.links.length; k++) {
      links += ',' + release.links[k];
    }
  }

  const releaseDate = release.releaseDate.substr(0, release.releaseDate.indexOf('T'));
  const releaseTime = release.releaseDate.substr(release.releaseDate.indexOf('T'), release.releaseDate.length);

  const insertReleaseQuery = 'REPLACE INTO `' + dbName + '`.`releases` (id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,releaseTime,title,type,version,search) values ("' + release.id + '","' + release.catalogId + '","' + release.artistsTitle + '","' + release.genrePrimary + '","' + release.genreSecondary + '","' + links + '","' + releaseDate + '","' + releaseTime + '","' + release.title + '","' + release.type + '","' + release.version + '","' + release.search + '");';

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
    function (err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        callback(JSON.parse(body));
      }
    });
}
