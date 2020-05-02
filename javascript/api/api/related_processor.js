const { fork } = require('child_process');

function processRelated(searchArray, sqlResult, callback) {
    var arrayWithSimiliarity = [];

    var i = 0;

    var loopCallback = function () {
        if (i < searchArray.length) {
            const process = fork('/app/api/similarity_processor.js');
            process.send({
                removeId: true,
                searchString: searchArray[i].search.replace(searchArray[i].id, ''),
                searchArray: sqlResult
            });

            process.on('message', (processResult) => {
                for(var k=0; k<processResult.length; k++){
                    var similarity = processResult[k].similarity;
                    const id = processResult[k].id;

                    if (arrayWithSimiliarity[k] !== undefined) {
                        similarity += arrayWithSimiliarity[k].similarity;
                    }
        
                    arrayWithSimiliarity[k] = {
                        id: id,
                        similarity: similarity
                    };
                }
                
                i++;
                loopCallback();
            });
        } else {
            arrayWithSimiliarity.sort(function (a, b) {
                if (a.similarity < b.similarity) return 1;
                if (a.similarity > b.similarity) return -1;
                return 0;
            });

            callback(arrayWithSimiliarity)
        }
    }

    loopCallback();
}

process.on('message', async (data) => {
    processRelated(data.searchArray, data.sqlResult, function(result){
        process.send({ results: result });
    });
});