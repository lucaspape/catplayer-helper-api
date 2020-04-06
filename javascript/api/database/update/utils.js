const request = require('request');
const fs = require('fs');

module.exports = {
  download: function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  }
};