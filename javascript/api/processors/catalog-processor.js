const utils = require('/app/utils.js');
const sqlhelper = utils.sqlhelper;

function processCatalogSearch(searchString, terms, trackArray, skip, limit, gold, callback, errorCallback) {
    sqlhelper.getConnection(
        function (mysqlConnection) {
            for (var k = 1; k < terms.length; k++) {
                trackArray = trackArray.filter(track => new RegExp(terms[k], 'i').test(trackArray[i].search));
            }

            for (var i = 0; i < trackArray.length; i++) {
                trackArray[i].similarity = utils.similarity(trackArray[i].search.replace(trackArray[i].id, ''), searchString);
            }

            trackArray.sort(function (a, b) {
                if (a.similarity < b.similarity) return 1;
                if (a.similarity > b.similarity) return -1;
                return 0;
            });

            trackArray = trackArray.slice(skip, skip + limit);

            utils.addReleaseObjects(mysqlConnection, trackArray, gold, (result)=>{
              callback(result);
            },(err)=>{
              errorCallback(err);
            });
        }, function (err) {
            console.log(err);
            errorCallback(err);
        });
}

process.on('message', async (data) => {
    processCatalogSearch(data.searchString, data.terms, data.trackArray, data.skip, data.limit, data.gold, function (result) {
        process.send({ results: result });
    }, function (err) { process.send({ err: err }) });
});
