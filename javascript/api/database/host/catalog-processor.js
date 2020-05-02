const utils = require('./utils.js');

function processCatalogSearch(terms, trackArray, skip, limit ,mysqlConnection, callback, errorCallback) {
    for (var k = 1; k < terms.length; k++) {
        trackArray = trackArray.filter(track => new RegExp(terms[k], 'i').test(track.search));
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

    var i = 0;

    var releasesQueryFinished = function () {
        if (i < trackArray.length) {
            const releaseQuery = 'SELECT artistsTitle, catalogId, id, releaseDate, title, type FROM `' + dbName + '`.`releases` WHERE id="' + trackArray[i].releaseId + '";';

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

process.on('message', async (data) => {
    processCatalogSearch(data.terms, data.trackArray, data.skip, data.limit, data.mysqlConnection, function (result) {
        process.send({ result: result });
    }, function (err) { process.send({ err: err }) });
});