const utils = require('/app/utils.js');

function processRelated(searchArray, allSongs, gold, callback, errorCallback) {
  utils.sqlhelper.getConnection(
      function (mysqlConnection) {
        var arrayWithSimiliarity = [];

        for (var i = 0; i < searchArray.length; i++) {
            const firstSearch = searchArray[i].search.replace(searchArray[i].id, '');

            for(var k=0; k<allSongs.length; k++){
                var secondSearch = allSongs[k].search.replace(allSongs[k].id, '');

                var similarity = utils.similarity(firstSearch, secondSearch);
                const id = allSongs[k].id;

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
             callback(arrayWithSimiliarity);
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
    processRelated(data.searchArray, data.allSongs, data.gold, function (result) {
        process.send({ results: result });
    }, function (err) { process.send({ err: err }) });
});
