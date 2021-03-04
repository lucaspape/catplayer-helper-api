'use strict';
const dbName = 'monstercatDB';

module.exports = {
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
  addMissingTrackKeys: function(track, gold, releaseObject, mysqlConnection, callback, errorCallback) {
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
  },
};
