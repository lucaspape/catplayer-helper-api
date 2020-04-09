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
  const image_width = fixResolution(req.query.image_width);
  console.log(image_width);
  const releaseId = req.params.releaseId;
  const releaseDir = __dirname + '/static/' + releaseId

  const coverFileFull = 'cover_2048.jpg'
  const coverFile = 'cover_' + image_width + '.jpg'

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir);
  }

  if (!fs.existsSync(releaseDir + '/' + coverFileFull)) {
    utils.download('https://connect.monstercat.com/v2/release/' + releaseId + '/cover?image_width=2048', releaseDir + '/' + coverFileFull, function() {
      sharp(releaseDir + '/' + coverFileFull)
        .resize(image_width, image_width)
        .toFile(releaseDir + '/' + coverFile, (err, info) => {
          if (err) {
            res.send(err);
          } else {
            res.send({
              filename: coverFile
            });
          }
        });
    });
  } else if (!fs.existsSync(releaseDir + '/' + coverFile)) {
    sharp(releaseDir + '/' + coverFileFull)
      .resize(image_width, image_width)
      .toFile(releaseDir + '/' + coverFile, (err, info) => {
        if (err) {
          res.send(err);
        } else {
          res.send({
            filename: coverFile
          });
        }
      });
  } else {
    res.send({
      filename: coverFile
    });
  }
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

function fixResolution(res) {
  console.log('Input res: ' + res);
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