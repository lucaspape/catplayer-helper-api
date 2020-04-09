const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const fs = require('fs');
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
  const releaseId = req.params.releaseId;
  const releaseDir = 'static/' + releaseId
  const coverFile = releaseDir + "/cover.jpg"

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir);
  }

  if (!fs.existsSync(coverFile)) {
    utils.download('https://connect.monstercat.com/v2/release/' + releaseId + '/cover?image_width=2048', coverFile, function() {
      coverFile
    });
  } else {
    fs.sendFile(coverFile);
  }
});