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
    createDatabaseConnection.query('CREATE DATABASE IF NOT EXISTS ' + dbName + ' DEFAULT CHARACTER SET "utf8" COLLATE "utf8_unicode_ci";', (err, result) => {
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
  const createCatalogTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`catalog` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `id` VARCHAR(36) PRIMARY KEY, `artists` TEXT, `artistsTitle` TEXT, `bpm` INT, `creatorFriendly` TEXT, `debutDate` TEXT, `duration` INT, `explicit` TEXT, `genrePrimary` TEXT, `genreSecondary` TEXT, `isrc` TEXT, `playlistSort` INT, `releaseId` TEXT, `tags` TEXT, `title` TEXT, `trackNumber` INT, `version` TEXT, `inEarlyAccess` TEXT, `search` TEXT);'
  mysqlConnection.query(createCatalogTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created catalog table');

      initCatalog(mysqlConnection, function() {
        console.log('Done!');

        //wait 5 minutes
        setTimeout(function() {
          initializeDatabase(mysqlConnection);
        }, 300000);
      });
    }
  });
}

function initCatalog(mysqlConnection, callback) {
  browseTracks(-1, 0,
    function(json) {
      console.log('Received catalog data...');
      const trackArray = json.results.reverse();

      var i = 0;

      var sqlCallback = function() {
        if (i < trackArray.length) {
          if (i % 100 === 0) {
            console.log((i / trackArray.length) * 100 + '%');
          }

          addToDB(trackArray[i], mysqlConnection, function() {
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

function addToDB(track, mysqlConnection, callback) {
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

  var artistIds = track.artists[0].id;

  if (artistIds !== undefined) {
    for (var k = 1; k < track.artists.length; k++) {
      artistIds += ',' + track.artists[k].id;
    }
  } else {
    artistIds = '';
  }

  const insertTrackQuery = 'INSERT INTO `' + dbName + '`.`catalog` (id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search) values ("' + track.id + '","' + artistIds + '","' + track.artistsTitle + '","' + track.bpm + '","' + track.creatorFriendly + '","' + track.debutDate + '","' + track.duration + '","' + track.explicit + '","' + track.genrePrimary + '","' + track.genreSecondary + '","' + track.isrc + '","' + track.playlistSort + '","' + track.release.id + '","' + track.tags + '","' + track.title + '","' + track.trackNumber + '","' + track.version + '","' + track.inEarlyAccess + '","' + track.search + '") ON DUPLICATE KEY UPDATE id="' + track.id + '";';

  mysqlConnection.query(insertTrackQuery, (err, results) => {
    if (err) {
      console.log(err);
    }

    callback()
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