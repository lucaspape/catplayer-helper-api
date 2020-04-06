const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const releasesDBDefaults = {
  releases: [],
  releasesGold: []
}

const releasesDBFile = 'db-releases.json';
const releasesDBTempFile = 'db-releases-temp.json';

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

function initializeDatabase() {
  console.log('Starting init...');
  initReleases(function() {
    console.log('Database init done!');

    setTimeout(function() {
      initializeDatabase();
    }, 3600000);
  });
}

function initReleases(callback) {
  const dbAdapter = new FileSync(releasesDBTempFile);
  const db = lowdb(dbAdapter);
  db.defaults(releasesDBDefaults)
    .write();

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

        release.downloadable = false;

        if (release.inEarlyAccess) {
          release.streamable = false;
        } else {
          release.streamable = true;
        }

        db.get('releases')
          .push(release)
          .write();

        release.streamable = true;

        if (release.inEarlyAccess) {
          release.downloadable = false;
        } else {
          release.downloadable = true;
        }

        db.get('releasesGold')
          .push(release)
          .write();
      }

      fs.rename(releasesDBTempFile, releasesDBFile, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Releases db init done!');
        }
      });

      callback();
    },

    function(err) {
      console.log(err);
    });
}

initializeDatabase();