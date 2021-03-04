const utils = require('../../database/host/utils.js');

function processArtistSearch(searchString, terms, artistsArray, skip, limit, callback) {
    for (var k = 1; k < terms.length; k++) {
        artistsArray = artistsArray.filter(artist => new RegExp(terms[k], 'i').test(artist.search));
      }

      for (var i = 0; i < artistsArray.length; i++) {
        artistsArray[i].similarity = utils.similarity(artistsArray[i].search.replace(artistsArray[i].id, ''), searchString);
      }

      artistsArray.sort(function(a, b) {
        if (a.similarity < b.similarity) return 1;
        if (a.similarity > b.similarity) return -1;
        return 0;
      });

      artistsArray = artistsArray.slice(skip, skip + limit);

      for (var i = 0; i < artistsArray.length; i++) {
        artistsArray[i] = utils.addMissingArtistKeys(artistsArray[i]);
      }

      callback(artistsArray);
}

process.on('message', async (data) => {
    processArtistSearch(data.searchString, data.terms, data.artistsArray, data.skip, data.limit, function (result) {
        process.send({ results: result });
    });
});