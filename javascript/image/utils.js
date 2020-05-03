const http = require('http');
const http = require('https');
const fs = require('fs');

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

module.exports = {
  download: function(url, filename, callback, errorCallback) {
    const file = fs.createWriteStream(filename);
    http.get(url, function(response){
        response.pipe(file);

        callback();
    }).setTimeout(1000, function(){
        errorCallback();
    }),

    downloadHttps: function(url, filename, callback, errorCallback) {
      const file = fs.createWriteStream(filename);
      https.get(url, function(response){
          response.pipe(file);
  
          callback();
      }).setTimeout(1000, function(){
          errorCallback();
      });
  },

  similarity: function(s1, s2) {
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
};