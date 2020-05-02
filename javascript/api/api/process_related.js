const utils = require('./utils.js');

async function processRelated(searchArray, sqlResult) {
    var arrayWithSimiliarity = [];

    for (var i = 0; i < sqlResult.length; i++) {
        var firstSearch = searchArray[i].search.replace(searchArray[i].id, '');

        for (var k = 0; k < sqlResult.length; k++) {
            //remove id from search
            var secondSearch = sqlResult[k].search.replace(sqlResult[k].id, '');
            var similarity = utils.similarity(firstSearch, secondSearch);

            if (arrayWithSimiliarity[k] !== undefined) {
                similarity += arrayWithSimiliarity[k].similarity;
            }

            arrayWithSimiliarity[k] = {
                id: sqlResult[k].id,
                similarity: similarity
            };
        }
    }

    arrayWithSimiliarity.sort(function (a, b) {
        if (a.similarity < b.similarity) return 1;
        if (a.similarity > b.similarity) return -1;
        return 0;
    });

    return arrayWithSimiliarity;
}

process.on('message', async (data) => {
    const result = await processRelated(data.searchArray, data.sqlResult);

    process.send({ result: result });
});