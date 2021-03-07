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

        var releasesQueryFinished = function () {
          if (i < arrayWithSimiliarity.length) {
            utils.getRelease(mysqlConnection, arrayWithSimiliarity[i].releaseId, (release)=>{
              utils.addMissingTrackKeys(arrayWithSimiliarity[i], gold, release, mysqlConnection, function (track) {
                arrayWithSimiliarity[i] = track;
                i++;
                releasesQueryFinished();
              }, function (err) {
                res.send(err);
              });
            }, (err)=>{
              res.send(err);
            })
          } else {
            var returnObject = {
              results: arrayWithSimiliarity
            };

            res.send(returnObject);
          }
        };

        releasesQueryFinished();
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
