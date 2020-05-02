const utils = require('../utils.js');

async function processSimilarity(removeId, searchString, searchArray){
    var similarityArray = [];

    for(var i=0; i<searchArray.length; i++){
        var secondSearch = searchArray[i].search;

        if(removeId){
            secondSearch = secondSearch.replace(searchArray[i].id, '');
        }

        similarityArray[i] = {
            similarity: utils.similarity(searchString, secondSearch),
            id: searchArray[i].id
        };
    }

    return similarityArray;
}

process.on('message', async (data) => {
    const result = await processSimilarity(data.removeId, data.searchString, data.searchArray);

    process.send(result);
});