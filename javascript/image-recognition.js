const tesseract = require('node-tesseract-ocr');
const request = require('request');
const fs = require('fs');

const titleImageUrl = 'http://10.10.0.2:4000/api/v1/title';
const artistImageUrl = 'http://10.10.0.2:4000/api/v1/artist';

var minimumConfidence = 35.0;

var config = {};

const configFile = 'configs/config_recognition.json';

function loadConfig() {
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile));
  }
}

function recognize() {
  setTimeout(function() {
    loadConfig();

    console.log('Config loaded!');

    //download the screenshots
    const dateNow = Date.now() / 1000;

    var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var dayName = days[new Date().getDay()];

    for (var i = 0; i < config.override.length; i++) {
      if (config.override[i].day === dayName) {
        const currentHour = new Date().getHours();

        if (currentHour >= config.override[i].time && currentHour < config.override[i].time + config.override[i].length) {
          if (config.override[i].finalObject !== undefined) {
            console.log('Override! Using custom object.');
            fs.writeFileSync('currentdata.json', JSON.stringify(config.override[i].finalObject));
            return;
          }
        }
      }
    }

    const titleFileName = 'recognition/title_' + dateNow + '.png';
    const artistFileName = 'recognition/artist' + dateNow + '.png';

    downloadImages(titleFileName, artistFileName, function() {
      recognizeText(artistFileName, function(artistText) {
        recognizeText(titleFileName, function(titleText) {
          console.log('Recognized text: ' + artistText + " / " + titleText);

          searchTitle(artistText, titleText);

          fs.unlinkSync(titleFileName);
          fs.unlinkSync(artistFileName);
        }, function() {
          recognize();
        });
      }, function() {
        recognize();
      });
    });
  }, 100);
}

function downloadImages(titleFileName, artistFileName, downloadFinishedCallback) {
  download(titleImageUrl, titleFileName, function() {
    download(artistImageUrl, artistFileName, function() {
      downloadFinishedCallback();
    });
  });
}

const tesseractOptions = {
  l: 'eng',
  psm: 6
}

function recognizeText(imagePath, finishedCallback, errorCallback) {
  tesseract.recognize(imagePath, tesseractOptions)
    .then(text => {
      finishedCallback(text.replace(/\n/g, " ").replace(/[^ -~]+/g, ""));
    }).catch((error) => {
      console.log(error);
      fs.unlinkSync(imagePath);
      errorCallback();
    });
}

function orderBySimilarity(artistText, titleText, trackArray, includeVersionConfidence) {
  var similarityArray = []

  var arrayIndex = 0;

  for (var i = 0; i < trackArray.length; i++) {
    if (trackArray[i] !== undefined) {
      var versionConfidence = 0.0;

      if (trackArray[i].version === '' || trackArray[i].version === undefined) {
        versionConfidence = 100;
      }

      const similarityObject = {
        title: trackArray[i].title,
        version: trackArray[i].version,
        artist: trackArray[i].artistsTitle,
        track: trackArray[i],
        titleConfidence: similarity(trackArray[i].title, titleText),
        artistConfidence: similarity(trackArray[i].artistsTitle, artistText),
        versionConfidence: versionConfidence
      }

      if (includeVersionConfidence) {
        similarityObject.totalConfidence = (similarityObject.titleConfidence + similarityObject.artistConfidence + similarityObject.versionConfidence) / 3;
      } else {
        similarityObject.totalConfidence = (similarityObject.titleConfidence + similarityObject.artistConfidence) / 2;
      }

      similarityArray[arrayIndex] = similarityObject;
      arrayIndex++;
    }
  }

  return similarityArray.sort((a, b) => (a.totalConfidence - b.totalConfidence)).reverse();
}

function searchQuery(searchTerm, callback, errorCallback) {
  searchTerm = searchTerm.replace('(', '%7B');
  searchTerm = searchTerm.replace(')', '%7D');
  searchTerm = searchTerm.replace(' ', '%20');
  searchTerm = searchTerm.trim();

  request({
    url: 'http://database-local:7000/v1/catalog/search?term=' + searchTerm + '&limit=-1',
    method: 'GET'
  }, function(err, resp, body) {
    if (err) {
      errorCallback(err);
    } else {
      callback(JSON.parse(body));
    }
  });
}

function searchTitle(tempArtist, tempTitle) {
  console.log('Searching title...');

  searchQuery(tempTitle,
    function(json) {
      var responseTrackArray = json.results;

      const similarityArray = orderBySimilarity(tempArtist, tempTitle, responseTrackArray, false);
      const finalObject = similarityArray[0];

      if (finalObject !== undefined) {
        if (finalObject.totalConfidence > minimumConfidence) {
          fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

          console.log('Done!');

          recognize();

          return;
        }
      }

      searchArtist(tempTitle, tempArtist);
    },
    function(err) {
      console.log(err);
    });
}

function searchArtist(tempTitle, tempArtist) {
  console.log('Using artist search...');

  searchQuery(tempArtist,
    function(json) {
      var responseTrackArray = json.results;

      const similarityArray = orderBySimilarity(tempArtist, tempTitle, responseTrackArray, false);
      const finalObject = similarityArray[0];

      if (finalObject !== undefined) {
        if (finalObject.totalConfidence > minimumConfidence) {
          fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

          console.log('Done!');

          recognize();

          return;
        }
      }

      advancedSearch(tempTitle, tempArtist);
    },
    function(err) {
      console.log(err);
    });
}

//used if could not find track because version is in title
function advancedSearch(tempTitle, tempArtist) {
  console.log('Advanced search...');

  const splitTitle = tempTitle.split(' ');

  var k = splitTitle.length;

  function loopFunction() {
    //LOOP THIS
    if (k > 0) {
      var searchTerm = '';

      for (var i = 0; i < k; i++) {
        searchTerm = searchTerm + splitTitle[i];
      }

      var rest = '';

      for (var i = k; i < splitTitle.length; i++) {
        rest = splitTitle[i];
      }

      searchQuery(searchTerm,
        function(json) {
          var responseTrackArray = json.results;

          const similarityArray = orderBySimilarity(tempArtist, tempTitle, responseTrackArray, true);
          const finalObject = similarityArray[0];

          if (finalObject !== undefined) {
            if (finalObject.totalConfidence > minimumConfidence) {
              fs.writeFileSync('currentdata.json', JSON.stringify(finalObject));

              console.log('Done!');

              recognize();

              //STOP LOOP
              return;
            }
          }
          k--;

          //CONTINUE LOOP
          loopFunction();;
        },
        function(err) {
          console.log(err);
        });
    } else {
      //could not find
      console.log('Could not find song!');

      recognize();
    }
  }

  //start loop
  loopFunction();
}

recognize();

function download(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function similarity(s1, s2) {
  if (s1 !== undefined && s2 !== undefined) {
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
  } else {
    return 0.0;
  }
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