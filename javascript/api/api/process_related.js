async function processRelated(firstSearch, array){
    var arrayWithSimiliarity = [];

    for (var k = 0; k < array.length; k++) {
        //remove id from search
        var secondSearch = array[k].search.replace(array[k].id, '');
        var similarity = utils.similarity(firstSearch, secondSearch);

        arrayWithSimiliarity[k] = {
          id: array[k].id,
          similarity: similarity
        };
      }

      return arrayWithSimiliarity;
}

process.on('message', async(data) =>{
    const result = await processRelated(data.firstSearch, data.array);

    process.send({result});
});