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
  const releaseId = req.params.releaseId;
  const releaseDir = __dirname + '/static/' + releaseId

  const coverFileFull = releaseDir + '/cover_2048.jpg'
  const coverFile = releaseDir + '/cover_' + image_width + '.jpg'

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir);
  }

  if (!fs.existsSync(coverFileFull)) {
    utils.download('https://connect.monstercat.com/v2/release/' + releaseId + '/cover?image_width=2048', coverFileFull, function() {
      sharp(coverFileFull)
        .resize(image_width, image_width)
        .toFile(coverFile, (err, info) => {
          if (err) {
            res.send(err);
          } else {
            res.redirect('https://api.lucaspape.de/monstercat/v1/' + coverFile);
          }
        });
    });
  } else if (!fs.existsSync(coverFile)) {
    sharp(coverFileFull)
      .resize(image_width, image_width)
      .toFile(coverFile, (err, info) => {
        if (err) {
          res.send(err);
        } else {
          res.redirect('https://api.lucaspape.de/monstercat/v1/' + coverFile);
        }
      });
  } else {
    res.redirect('https://api.lucaspape.de/monstercat/v1/' + coverFile);
  }
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

function fixResolution(res) {
  console.log(res);
  if (res === undefined) {
    return 512;
  } else if (parseInt(res) > 2048) {
    return 2048;
  } else {
    return parseInt(res);
  }
}