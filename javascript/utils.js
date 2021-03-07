const request = require('request');
const fs = require('fs');
const sqlhelper = require('/app/sqlhelper.js');

const dbName = sqlhelper.dbName;

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function addMissingReleaseKeys(release) {
  if (release.links.length > 0) {
    release.links = release.links.split(',');
  } else {
    release.links = [];
  }

  return release;
}

function addMissingTrackKeys(track, gold, releaseObject, mysqlConnection, callback, errorCallback) {
  if (track !== undefined) {
    if (track.inEarlyAccess === 'true') {
      track.downloadable = false;
      track.streamable = gold;
    } else if (track.tags !== undefined && track.tags.includes('streamingonly')){
      track.streamable = true;
      track.downloadable = false;
    }else{
      track.streamable = true;
      track.downloadable = gold;
    }

    if (track.tags !== undefined) {
      const tags = track.tags.split(',');
      track.tags = [];

      for (var i = 0; i < tags.length; i++) {
        track.tags[i] = tags[i];
      }
    }

    if (releaseObject !== undefined) {
      track.release = {
        artistsTitle: releaseObject.artistsTitle,
        catalogId: releaseObject.catalogId,
        id: releaseObject.id,
        releaseDate: releaseObject.releaseDate,
        title: releaseObject.title,
        type: releaseObject.type
      };

    } else {
      track.release = {};
    }

    if (track.artists !== undefined && track.artists !== null && track.artists !== '') {
      var artistArray = [];
      const artists = track.artists.split(',');

      var i = 0;

      var sqlCallback = function() {
        if (i < artists.length) {
          const artistQuery = 'SELECT id,name FROM `' + dbName + '`.`artists` WHERE artists.id="' + artists[i] + '";';

          mysqlConnection.query(artistQuery, (err, artistResults) => {
            if (err) {
              errorCallback(err);
            } else {
              if(artistResults[0] != null){
                artistArray[i] = artistResults[0];
              }

              i++;
              sqlCallback();
            }
          });

        } else {
          track.artists = artistArray;

          if(track.artists == null || track.artists === ''){
            track.artists = [];
          }

          callback(track);
        }
      };

      sqlCallback();
    } else {
      track.artists = [];
      callback(track);
    }
  } else {
    callback(track);
  }
}

module.exports = {
  sqlhelper: sqlhelper,
  similarity: function(s1, s2) {
    if (s1 !== undefined && s2 !== undefined) {
      var longer = s1;
      var shorter = s2;
      if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
      }
      var longerLength = longer.length;
      if (longerLength == 0) {
        return 1.0;
      }
      return ((longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)) * 100.0;
    } else {
      return 0.0;
    }
  },
  fixSearchString: function(searchString) {
    if (searchString === undefined) {
      return '';
    } else {
      searchString = searchString.replace(/[^\x20-\x7E]/g, "");
      searchString = searchString.replace('(', '%7B');
      searchString = searchString.replace(')', '%7D');
      searchString = searchString.replace(' ', '%20');
      searchString = searchString.trim();

      return searchString;
    }
  },

  fixSkipAndLimit: function(reqQuery, callback) {
    var skip = 0;
    var limit = 50;

    if (reqQuery.skip !== undefined) {
      skip = parseInt(reqQuery.skip);
    }

    if (reqQuery.limit !== undefined) {
      limit = parseInt(reqQuery.limit);

      if (limit > 50) {
        limit = 50;
      }
    }

    callback(skip, limit);
  },

  download: function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  },
  addMissingReleaseKeys: addMissingReleaseKeys,
  addMissingTrackKeys: addMissingTrackKeys,

  addMissingArtistKeys: function(artist) {
    if (artist.years.length > 0) {
      artist.years = artist.years.split(',');
    } else {
      artist.years = [];
    }

    if (artist.links.length > 0) {
      artist.links = artist.links.split(',');
    } else {
      artist.links = [];
    }

    artist.about = Buffer.from(artist.about, 'base64').toString('ascii');

    return artist;
  },
  getRelease: function(mysqlConnection, releaseId, callback, errorCallback) {
    var getReleaseQuery = 'SELECT id,catalogId,artistsTitle,genrePrimary,genreSecondary,links,releaseDate,title,type,version FROM `' + dbName + '`.`releases` WHERE id="' + releaseId + '";';

    mysqlConnection.query(getReleaseQuery, (err, result) => {
      if (err) {
        errorCallback(err);
      } else {
        callback(addMissingReleaseKeys(result[0]));
      }
    });
  },
  getTracksFromIds: function(mysqlConnection,trackIdArray, gold, releaseObject, callback, errorCallback) {
    var trackArray = [];
    var i = 0;

    var sqlCallback = function() {
      if (i < trackIdArray.length) {
        const catalogId = trackIdArray[i];
        const catalogQuery = 'SELECT catalog.id,artists,catalog.artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,catalog.genrePrimary,catalog.genreSecondary,isrc,playlistSort,releaseId,tags,catalog.title,trackNumber,catalog.version,inEarlyAccess FROM `' + sqlhelper.dbName + '`.`catalog`' + ' WHERE id="' + catalogId + '";';

        mysqlConnection.query(catalogQuery, (err, result) => {
          if (err) {
            errorCallback(err);
          } else {
            addMissingTrackKeys(result[0], gold, releaseObject, mysqlConnection, function(track) {
              trackArray[i] = track;
              i++;
              sqlCallback();
            }, function(err) {
              errorCallback(err);
            });
          }
        });
      } else {
        callback(trackArray);
      }
    }

    sqlCallback();
  },
  getTracksFromNotIds: function(mysqlConnection,trackIdArray, skipMonstercatTracks, callback, errorCallback) {
    var trackArray = [];
    var i = 0;

    var sqlCallback = function() {
      if (i < trackIdArray.length) {
        const catalogId = trackIdArray[i];
        var catalogQuery = 'SELECT catalog.id,artists,catalog.artistsTitle,bpm ,creatorFriendly,debutDate,duration,explicit,catalog.genrePrimary,catalog.genreSecondary,isrc,playlistSort,releaseId,tags,catalog.title,trackNumber,catalog.version,inEarlyAccess FROM `' + sqlhelper.dbName + '`.`catalog`' + ' WHERE id!="' + catalogId + '" ';

        if (skipMonstercatTracks) {
          catalogQuery += 'AND artistsTitle NOT LIKE "Monstercat";';
        }

        mysqlConnection.query(catalogQuery, (err, result) => {
          if (err) {
            errorCallback(err);
          } else {
            trackArray[i] = result[0];
            i++;
          }
        });
      } else {
        callback(trackArray);
      }
    }

    sqlCallback();
  }
};
