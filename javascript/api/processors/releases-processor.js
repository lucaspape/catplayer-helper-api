const utils = require('./utils.js');

function processReleasesSearch(searchString, terms, releaseArray, skip, limit, callback) {
    for (var k = 1; k < terms.length; k++) {
        releaseArray = releaseArray.filter(release => new RegExp(terms[k], 'i').test(release.search));
    }

    for (var i = 0; i < releaseArray.length; i++) {
        releaseArray[i].similarity = utils.similarity(releaseArray[i].search.replace(releaseArray[i].id, ''), searchString);
    }

    releaseArray.sort(function (a, b) {
        if (a.similarity < b.similarity) return 1;
        if (a.similarity > b.similarity) return -1;
        return 0;
    });

    releaseArray = releaseArray.slice(skip, skip + limit);

    for (var i = 0; i < releaseArray.length; i++) {
        releaseArray[i] = utils.addMissingReleaseKeys(releaseArray[i]);
    }

    callback(releaseArray);
}

process.on('message', async (data) => {
    processReleasesSearch(data.searchString, data.terms, data.releaseArray, data.skip, data.limit, function (result) {
        process.send({ results: result });
    });
});
