const utils = require('/app/utils.js');

function processRelated(searchArray, allSongs, gold, callback, errorCallback) {
  utils.sqlhelper.getConnection(
      function (mysqlConnection) {
        for (var i = 0; i < searchArray.length; i++) {
            const firstSearch = searchArray[i].search.replace(searchArray[i].id, '');

            for(var k=0; k<allSongs.length; k++){
                var secondSearch = allSongs[k].search.replace(allSongs[k].id, '');

                var similarity = utils.similarity(firstSearch, secondSearch);
                const id = allSongs[k].id;

                if (allSongs[k].similarity) {
                    similarity += allSongs[k].similarity;
                }

                allSongs[k].similarity = similarity;
            }
        }

        allSongs.sort(function (a, b) {
            if (a.similarity < b.similarity) return 1;
            if (a.similarity > b.similarity) return -1;
            return 0;
        });

        allSongs = JSON.parse(JSON.stringify(allSongs.slice(0, 50)));

        var releasesQueryFinished = function () {
          if (i < allSongs.length) {
            utils.getRelease(mysqlConnection, allSongs[i].releaseId, (release)=>{
              utils.addMissingTrackKeys(allSongs[i], gold, release, mysqlConnection, function (track) {
                allSongs[i] = track;
                i++;
                releasesQueryFinished();
              }, function (err) {
                res.send(err);
              });
            }, (err)=>{
              res.send(err);
            })
          } else {
             callback(allSongs);
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
