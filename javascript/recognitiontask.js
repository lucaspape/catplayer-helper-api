const tesseract = require('node-tesseract-ocr');
const request = require('request');
const fs = require('fs');

const tesseractOptions = {
        l: 'eng',
        psm: 6
}

var recognize = function(){
  const dateNow = Date.now() / 1000;

  const titleFileName = 'recognition/title_' + dateNow + '.png';
  const artistFileName = 'recognition/artist' + dateNow + '.png';

  //download the screenshots

  download('http://192.168.227.10:4000/api/v1/title', titleFileName, function(){
    download('http://192.168.227.10:4000/api/v1/artist', artistFileName, function(){
      tesseract.recognize(artistFileName, tesseractOptions)
          .then(artist => {
            var tempArtist = artist.replace('\n\u000c', '');
            tesseract.recognize(titleFileName, tesseractOptions)
              .then(title => {
                var tempTitle = title.replace('\n\u000c', '');

                //search for the song
                search(tempArtist, tempTitle);

                fs.unlinkSync(titleFileName);
                fs.unlinkSync(artistFileName);
              }).catch((error) => {console.log(error); fs.unlinkSync(titleFileName); fs.unlinkSync(artistFileName); recognize();});
           }).catch((error) => {console.log(error); fs.unlinkSync(titleFileName); fs.unlinkSync(artistFileName); recognize();});
      });
  });
}

var search = function(tempArtist, tempTitle){
  request({
    url: 'https://connect.monstercat.com/v2/catalog/browse?term=' + tempTitle + '&limit=50&skip=0&fields=&search=' + tempTitle,
    method: 'GET'
  }, function(err, resp, body){
    if(err){

    }else{
      console.log('tempTitle: ' + tempTitle);
      console.log('tempArtist: ' + tempArtist);

      var respJson = JSON.parse(body);

      var responseTrackArray = respJson.results;

      var similarityArray = []

      for(var i=0; i < responseTrackArray.length; i++){
        var versionConfidence = 0.0;

        if(responseTrackArray[i].version === '' || responseTrackArray[i].version === undefined){
          versionConfidence = 100;
        }

        const similarityObject = {
          title: responseTrackArray[i].title,
          version: responseTrackArray[i].version,
          artist: responseTrackArray[i].artistsTitle,
          releaseId: responseTrackArray[i].release.id,
          titleConfidence: similarity(responseTrackArray[i].title, tempTitle),
          artistConfidence: similarity(responseTrackArray[i].artistsTitle, tempArtist),
          versionConfidence: versionConfidence
        }

        similarityObject.totalConfidence = (similarityObject.titleConfidence+similarityObject.artistConfidence+similarityObject.versionConfidence) / 3;

        similarityArray[i] = similarityObject;
      }

      var finalObject = similarityArray[0];

      if(finalObject !== undefined){
        for(var i=1; i < similarityArray.length; i++){
          if(similarityArray[i].totalConfidence > finalObject.totalConfidence){
            finalObject = similarityArray[i];
          }
        }

          download('https://connect.monstercat.com/v2/release/' + finalObject.releaseId + '/cover?image_width=512', 'cover.png', function(){
          });

          fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

          console.log('Done!');

          setTimeout(function(){
            recognize();
          }, 3000);
    }else{
      searchArtist(tempTitle, tempArtist);
    }
  }
});
}

var searchArtist = function(tempTitle, tempArtist){
  console.log('Using artist search');

  request({
    url: 'https://connect.monstercat.com/v2/catalog/browse?term=' + tempArtist + '&limit=50&skip=0&fields=&search=' + tempArtist,
    method: 'GET'
  }, function(err, resp, body){
    if(err){

    }else{
      console.log('tempTitle: ' + tempTitle);
      console.log('tempArtist: ' + tempArtist);

      var respJson = JSON.parse(body);

      var responseTrackArray = respJson.results;

      var similarityArray = []

      for(var i=0; i < responseTrackArray.length; i++){
        var versionConfidence = 0.0;

        if(responseTrackArray[i].version === '' || responseTrackArray[i].version === undefined){
          versionConfidence = 100;
        }

        const similarityObject = {
          title: responseTrackArray[i].title,
          version: responseTrackArray[i].version,
          artist: responseTrackArray[i].artistsTitle,
          releaseId: responseTrackArray[i].release.id,
          titleConfidence: similarity(responseTrackArray[i].title, tempTitle),
          artistConfidence: similarity(responseTrackArray[i].artistsTitle, tempArtist),
          versionConfidence: versionConfidence
        }

        similarityObject.totalConfidence = (similarityObject.titleConfidence+similarityObject.artistConfidence+similarityObject.versionConfidence) / 3;

        similarityArray[i] = similarityObject;
      }

      var finalObject = similarityArray[0];

      if(finalObject !== undefined){
        for(var i=1; i < similarityArray.length; i++){
          if(similarityArray[i].totalConfidence > finalObject.totalConfidence){
            finalObject = similarityArray[i];
          }
        }

          download('https://connect.monstercat.com/v2/release/' + finalObject.releaseId + '/cover?image_width=512', 'cover.png', function(){
          });

          fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

          console.log('Done!');

          setTimeout(function(){
            recognize();
          }, 3000);
    }else{
      console.log('Using advanced search');
      advancedSearch(tempTitle, tempArtist);
    }
  }
});
}

//used if could not find track because version is in title
var advancedSearch = function(tempTitle, tempArtist){
  const splitTitle = tempTitle.split(' ');

  var k = splitTitle.length;

  var loopFunction = function(){
    //LOOP THIS
    if(k > 0){
      var searchTerm = '';

      for(var i=0; i<k; i++){
        searchTerm = searchTerm + splitTitle[i];
      }

      console.log(searchTerm);

      var rest = '';

      for(var i=k; i < splitTitle.length; i++){
        rest = splitTitle[i];
      }

      console.log(rest);

      //search for that
      request({
        url: 'https://connect.monstercat.com/v2/catalog/browse?term=' + searchTerm + '&limit=50&skip=0&fields=&search=' + searchTerm,
        method: 'GET'
      }, function(err, resp, body){
        if(err){

        }else{
          var respJson = JSON.parse(body);

          var responseTrackArray = respJson.results;

          var similarityArray = []

          for(var i=0; i < responseTrackArray.length; i++){
            const similarityObject = {
              title: responseTrackArray[i].title,
              version: responseTrackArray[i].version,
              artist: responseTrackArray[i].artistsTitle,
              releaseId: responseTrackArray[i].release.id,
              titleConfidence: similarity(responseTrackArray[i].title, tempTitle),
              artistConfidence: similarity(responseTrackArray[i].artistsTitle, tempArtist),
              versionConfidence: similarity(responseTrackArray[i].version, rest)
            }

            similarityObject.totalConfidence = (similarityObject.titleConfidence+similarityObject.artistConfidence+similarityObject.versionConfidence) / 3;

            similarityArray[i] = similarityObject;
          }

          var finalObject = similarityArray[0];

          if(finalObject !== undefined){
            for(var i=1; i < similarityArray.length; i++){
              if(similarityArray[i].totalConfidence > finalObject.totalConfidence){
                finalObject = similarityArray[i];
              }
            }

              download('https://connect.monstercat.com/v2/release/' + finalObject.releaseId + '/cover?image_width=512', 'cover.png', function(){
              });

              fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

              console.log('Done!');

              setTimeout(function(){
                recognize();
              }, 3000);

              //STOP LOOP
            }else{
              k--;

                //CONTINUE LOOP
              loopFunction();
            }
          }
      });
    }else{
      //could not find
      console.log('Could not find, using backup');

      const backupObject = {
        title: tempTitle,
        version: '',
        artist: tempArtist,
        releaseId: 'dc7d8a07-0603-4580-9005-2a534f02edd8',
        titleConfidence: 0,
        artistConfidence: 0,
        versionConfidence: 0,
        totalConfidence: 0
      }

      download('https://connect.monstercat.com/v2/release/' + backupObject.releaseId + '/cover?image_width=512', 'cover.png', function(){
      });

      fs.writeFileSync('currentdata.json', JSON.stringify(backupObject));

      console.log('Done!');

      setTimeout(function(){
        recognize();
      }, 3000);
    }
  }

  //start loop
  loopFunction();
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
  return ((longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)) * 100.0;
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
