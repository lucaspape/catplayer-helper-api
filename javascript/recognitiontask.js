const tesseract = require('node-tesseract-ocr');
const request = require('request');
const fs = require('fs');

var recognize = function(){
    console.log('Updating...');

    var tesseractOptions = {
            l: 'eng',
            psm: 6
    }

    const dateNow = Date.now() / 1000;

    const titleFileName = 'recognition/title_' + dateNow + '.png';
    const artistFileName = 'recognition/artist' + dateNow + '.png';

    try{
    download('http://192.168.227.10:4000/api/v1/title', titleFileName, function(){
      download('http://192.168.227.10:4000/api/v1/artist', artistFileName, function(){
        tesseract.recognize(artistFileName, tesseractOptions)
            .then(artist => {
              var tempArtist = artist.replace('\n\u000c', '');

              tesseract.recognize(titleFileName, tesseractOptions)
                .then(title => {
                  var tempTitle = title.replace('\n\u000c', '');

                  request({
                    url: 'https://connect.monstercat.com/v2/catalog/browse?term=' + tempTitle + '&limit=50&skip=0&fields=&search=' + tempTitle,
                    method: 'GET'
                  }, function(err, resp, body){
                    if(err){

                    }else{
                      const respJson = JSON.parse(body);

                      const responseTrackArray = respJson.results;

                      const similarityArray = []

                      for(var i=0; i < responseTrackArray.length; i++){
                        const similarityObject = {
                          title: responseTrackArray[i].title,
                          version: responseTrackArray[i].version,
                          artist: responseTrackArray[i].artistsTitle,
                          releaseId: responseTrackArray[i].release.id,
                          artistSimilarity: similarity(responseTrackArray[i].artistsTitle, tempArtist)
                        }

                        similarityArray[i] = similarityObject;
                      }

                      var finalObject = similarityArray[0];

                      if(finalObject !== undefined){
                        for(var i=1; i < similarityArray.length; i++){
                          if(similarityArray[i].artistSimilarity > finalObject.artistSimilarity){
                            finalObject = similarityArray[i];
                          }
                        }

                        download('https://connect.monstercat.com/v2/release/' + finalObject.releaseId + '/cover?image_width=512', 'cover.png', function(){
                        });

                        fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

                        console.log('Done!');

                        fs.unlinkSync(titleFileName);
                        fs.unlinkSync(artistFileName);

                        setTimeout(function(){
                          recognize();
                        }, 3000);
                      }
                    }
                  });

       }).catch((error) => {console.log(error); fs.unlinkSync(titleFileName); fs.unlinkSync(artistFileName); recognize();});
       }).catch((error) => {console.log(error); fs.unlinkSync(titleFileName); fs.unlinkSync(artistFileName); recognize();});
      });
    });

    }catch(err){
      console.log(err);
      fs.unlinkSync(titleFileName);
      fs.unlinkSync(artistFileName);
      recognize();
    }
}

var download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

recognize();

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
