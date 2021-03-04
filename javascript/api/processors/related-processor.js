const utils = require('/app/utils.js');

function processRelated(searchArray, sqlResult, gold, callback, errorCallback) {
  utils.sqlhelper.getConnection(
      function (mysqlConnection) {
        var arrayWithSimiliarity = [];

        for (var i = 0; i < searchArray.length; i++) {
            const firstSearch = searchArray[i].search.replace(searchArray[i].id, '');

            for(var k=0; k<sqlResult.length; k++){
                var secondSearch = sqlResult[k].search.replace(sqlResult[k].id, '');

                var similarity = utils.similarity(firstSearch, secondSearch);
                const id = sqlResult[k].id;

                if (arrayWithSimiliarity[k] !== undefined) {
                    similarity += arrayWithSimiliarity[k].similarity;
                }

                arrayWithSimiliarity[k] = {
                    id: id,
                    similarity: similarity
                };
            }
        }

        arrayWithSimiliarity.sort(function (a, b) {
            if (a.similarity < b.similarity) return 1;
            if (a.similarity > b.similarity) return -1;
            return 0;
        });

        arrayWithSimiliarity = arrayWithSimiliarity.slice(0, 50);

        var catalogQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search FROM `' + utils.sqlhelper.dbName + '`.`catalog` WHERE id IN(';

        catalogQuery += '"' + arrayWithSimiliarity[0].id + '"';

        for(var i=1; i<arrayWithSimiliarity.length; i++){
          catalogQuery += ',"' + arrayWithSimiliarity[i].id + '"';
        }

        catalogQuery += ') ORDER BY FIELD(id, '
        catalogQuery += '"' + arrayWithSimiliarity[0].id + '"';

        for(var i=1; i<arrayWithSimiliarity.length; i++){
          catalogQuery += ',"' + arrayWithSimiliarity[i].id + '"';
        }

        catalogQuery += ");"

        mysqlConnection.query(catalogQuery, (err, catalogResult) => {
          if (err) {
            errorCallback(err);
          } else {
            var trackArray = catalogResult;
            var i = 0;

            var releasesQueryFinished = function () {
              if (i < catalogResult.length) {
                const releaseQuery = 'SELECT artistsTitle, catalogId, id, releaseDate, title, type FROM `' + utils.sqlhelper.dbName + '`.`releases` WHERE id="' + trackArray[i].releaseId + '";';

                mysqlConnection.query(releaseQuery, (err, releaseResult) => {
                  if (err) {
                    errorCallback(err);
                  } else {
                    utils.addMissingTrackKeys(trackArray[i], gold, releaseResult[0], mysqlConnection, function (track) {
                      trackArray[i] = track;
                      i++;
                      releasesQueryFinished();
                    }, function (err) {
                      errorCallback(err);
                    });

                  }
                });
              } else {
                callback(trackArray);
              }
            };

            releasesQueryFinished();
          }
        });
      },
        function (err) {
            console.log(err);
            errorCallback(err);
        });
}

process.on('message', async (data) => {
    processRelated(data.searchArray, data.sqlResult, data.gold, function (result) {
        process.send({ results: result });
    }, function (err) { process.send({ err: err }) });
});