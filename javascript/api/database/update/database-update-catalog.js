const request = require('request');
const mysql = require('mysql');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
  const createCatalogTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`catalog` (`id` VARCHAR(36), `artists` TEXT, `artistsTitle` TEXT, `bpm` INT, `creatorFriendly` TEXT, `debutDate` DATE, `debutTime` TEXT, `duration` INT, `explicit` TEXT, `genrePrimary` TEXT, `genreSecondary` TEXT, `isrc` TEXT, `playlistSort` INT, `releaseId` TEXT, `tags` TEXT, `title` TEXT, `trackNumber` INT, `version` TEXT, `inEarlyAccess` TEXT, `search` TEXT, PRIMARY KEY(`id`));'
  mysqlConnection.query(createCatalogTableQuery, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Created catalog table');

      initCatalog(mysqlConnection, function () {
        console.log('Done!');

        //wait 5 minutes
        setTimeout(function () {
          initializeDatabase(mysqlConnection);
        }, 300000);
      });
    }
  });
}

var idTempFilename = '';
var searchTempFilename = '';

function initCatalog(mysqlConnection, callback) {
  var id = uuidv4();
  idTempFilename = '/app/static/catalog-search' + id + '.txt';
  searchTempFilename = '/app/static/catalog-search' + id + '.txt';

  fs.closeSync(fs.openSync(idTempFilename, 'w'));
  fs.closeSync(fs.openSync(searchTempFilename, 'w'));

  browseTracks(-1, 0,
    function (json) {
      console.log('Received catalog data...');
      const trackArray = json.results.reverse();

      var i = 0;

      var sqlCallback = function () {
        if (i < trackArray.length) {
          if (i % 100 === 0) {
            console.log((i / trackArray.length) * 100 + '%');
          }

          addToDB(trackArray[i], mysqlConnection, function () {
            i++;
            sqlCallback();
          });
        } else {
          fs.renameSync(idTempFilename, '/app/static/catalog-search.txt' );
          fs.renameSync(searchTempFilename, '/app/static/catalog-search.txt');

          callback();
        }
      };

      sqlCallback();
    },

    function (err) {
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

  var artistIds = '';

  if(track.artists[0] !== undefined){
    artistIds = track.artists[0].id;

    if (artistIds !== undefined) {
      for (var k = 1; k < track.artists.length; k++) {
        artistIds += ',' + track.artists[k].id;
      }
    } else {
      artistIds = '';
    }
  }

  const debutDate = track.debutDate.substr(0, track.debutDate.indexOf('T'));
  const debutTime = track.debutDate.substr(track.debutDate.indexOf('T'), track.debutDate.length);

  track.search.replace(' ', '');
  track.search.replace('\n', '');

  const insertTrackQuery = 'REPLACE INTO `' + dbName + '`.`catalog` (id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime, duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search) values ("' + track.id + '","' + artistIds + '","' + track.artistsTitle + '","' + track.bpm + '","' + track.creatorFriendly + '","' + debutDate + '","' + debutTime + '","' + track.duration + '","' + track.explicit + '","' + track.genrePrimary + '","' + track.genreSecondary + '","' + track.isrc + '","' + track.playlistSort + '","' + track.release.id + '","' + track.tags + '","' + track.title + '","' + track.trackNumber + '","' + track.version + '","' + track.inEarlyAccess + '","' + track.search + '") ;';

  mysqlConnection.query(insertTrackQuery, (err, results) => {
    if (err) {
      console.log(err);
    }

    fs.appendFile(searchTempFilename, track.search + '\n', function (err) {
      if (err) throw err;
      fs.appendFile(idTempFilename, track.id + '\n', function (err) {
        if (err) throw err;
          callback();
      });
    });
  });
}

function browseTracks(limit, skip, callback, errorCallback) {
  request({
    url: 'https://connect.monstercat.com/v2/catalog/browse?limit=' + limit + '&skip=' + skip,
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
