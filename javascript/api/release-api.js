const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const sharp = require('sharp');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/release/';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + ':releaseId/cover', (req, res) => {
  const image_width = fixResolution(req.query.img_width);
  const releaseId = req.params.releaseId;

  downloadCoverImage(image_width, releaseId, function(resp) {
    res.send(resp);
  });
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

function downloadCoverImage(res, albumId, callback) {
  const releaseDir = __dirname + '/static/release/' + albumId;

  const coverFileOriginal = 'cover_2048.jpg';
  const coverFileFull = 'cover_2048.webp';
  const coverFile = 'cover_' + res + '.webp';

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir);
  }

  if (!fs.existsSync(releaseDir + '/' + coverFileFull)) {
    utils.download('https://connect.monstercat.com/v2/release/' + albumId + '/cover?image_width=2048', releaseDir + '/' + coverFileOriginal, function() {
      sharp(releaseDir + '/' + coverFileOriginal)
        .toFile(releaseDir + '/' + '/' + coverFile, (err, info) => {
          if (err) {
            callback(err);
          } else {
            sharp(releaseDir + '/' + coverFileOriginal)
              .resize(res, res)
              .toFile(releaseDir + '/' + '/' + coverFile, (err, info) => {
                if (err) {
                  callback(err);
                } else {
                  callback({
                    filename: coverFile
                  });
                }
              });
          }
        });
    });
  } else if (!fs.existsSync(releaseDir + '/' + coverFile)) {
    sharp(releaseDir + '/' + coverFileOriginal)
      .resize(res, res)
      .toFile(releaseDir + '/' + '/' + coverFile, (err, info) => {
        if (err) {
          callback(err);
        } else {
          callback({
            filename: coverFile
          });
        }
      });
  } else {
    callback({
      filename: coverFile
    });
  }
}

function fixResolution(res) {
  try {
    if (res === undefined) {
      return 512;
    } else if (parseInt(res) > 2048) {
      return 2048;
    } else {
      return parseInt(res);
    }
  } catch (e) {
    return 512;
  }
}