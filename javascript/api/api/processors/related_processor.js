const utils = require('../utils.js');

function processRelated(searchArray, sqlResult, callback) {
    var arrayWithSimiliarity = [];

    for (var i = 0; i < searchArray.length; i++) {
        const firstSearch = searchArray[i].search.replace(searchArray[i].id, '');

        for(var k=0; k<sqlResult.length; i++){
            var secondSearch = sqlResult[k].search.replace(searchArray[i].id, '');

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

    callback(arrayWithSimiliarity);
}

process.on('message', async (data) => {
    processRelated(data.searchArray, data.sqlResult, function (result) {
        process.send({ results: result });
    });
});