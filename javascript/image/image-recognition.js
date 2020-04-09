const tesseract = require('node-tesseract-ocr');
const request = require('request');
const fs = require('fs');
const utils = require('./utils.js');

const titleImageUrl = 'http://10.0.0.2:4000/api/v1/title';
const artistImageUrl = 'http://10.0.0.2:4000/api/v1/artist';

const outputFile = 'static/liveinfo.json'

var minimumConfidence = 35.0;

var config = {};

const configFile = 'image/configs/config_recognition.json';

function loadConfig(callback) {
  utils.download('https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/' + configFile,
    configFile,
    function() {
      if (fs.existsSync(configFile)) {
        config = JSON.parse(fs.readFileSync(configFile));
        callback();
      }
    });
}

function recognize() {
  setTimeout(function() {
    loadConfig(function() {
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
              fs.writeFileSync(outputFile, JSON.stringify(config.override[i].finalObject));
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
    });
  }, 100);
}

function downloadImages(titleFileName, artistFileName, downloadFinishedCallback) {
  utils.download(titleImageUrl, titleFileName, function() {
    utils.download(artistImageUrl, artistFileName, function() {
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
        titleConfidence: utils.similarity(trackArray[i].title, titleText),
        artistConfidence: utils.similarity(trackArray[i].artistsTitle, artistText),
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
    url: 'http://database-local/catalog/search?term=' + searchTerm + '&gold=false',
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
          fs.writeFileSync(outputFile, JSON.stringify(finalObject));

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
          fs.writeFileSync(outputFile, JSON.stringify(finalObject));

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
              fs.writeFileSync(outputFile, JSON.stringify(finalObject));

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