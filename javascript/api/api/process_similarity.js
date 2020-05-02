const utils = require('./utils.js');

async function processSimilarity(searchString, searchArray){
    var similarityArray = [];

    for(var i=0; i<searchArray.length; i++){
        var secondSearch = searchArray[i].search.replace(searchArray[i].id, '');
        similarityArray[i] = utils.similarity(searchString, secondSearch);
    }

    return similarityArray;
}

process.on('message', async (data) => {
    const result = await processSimilarity(data.searchString, data.searchArray);

    process.send(result);
});