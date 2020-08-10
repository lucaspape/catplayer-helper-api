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
}))

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

      app.post(APIPREFIX + '/catalog', (req, res) => {
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

  const insertTrackQuery = 'REPLACE INTO `' + dbName + '`.`catalog` (id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime, duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search) values ("' + track.id + '","' + artistIds + '","' + track.artistsTitle + '","' + track.bpm + '","' + track.creatorFriendly + '","' + debutDate + '","' + debutTime + '","' + track.duration + '","' + track.explicit + '","' + track.genrePrimary + '","' + track.genreSecondary + '","' + track.isrc + '","' + track.playlistSort + '","' + track.release.id + '","' + track.tags + '","' + track.title + '","' + track.trackNumber + '","' + track.version + '","' + track.inEarlyAccess + '","' + track.search + '") ;';

  mysqlConnection.query(insertTrackQuery, (err, results) => {
    if (err) {
      console.log(err);
    }

    callback()
  });
}
