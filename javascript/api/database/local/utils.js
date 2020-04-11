const dbName = 'monstercatDB';

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

module.exports = {
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
    }

    callback(skip, limit);
  },

  addMissingTrackKeys: function(track, gold, releaseObject, mysqlConnection, callback, errorCallback) {
    if (track !== undefined) {
      if (track.inEarlyAccess === 'true') {
        track.downloadable = false;
        track.streamable = gold;
      } else {
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

      if (track.artists !== undefined) {
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
                artistArray[i] = artistResults[0];

                i++;
                sqlCallback();
              }
            });

          } else {
            track.artists = artistArray;
            callback(track);
          }
        };

        sqlCallback();
      } else {
        callback(track);
      }
    } else {
      callback(track);
    }
  }
};