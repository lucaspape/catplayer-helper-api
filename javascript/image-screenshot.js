const screenshot = require('screenshot-desktop');
const fs = require('fs');
const sharp = require('sharp');
const tesseract = require('node-tesseract-ocr');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const recognitionConfigFile = 'configs/config_recognition.json';

var config = {};

var configFile = 'configs/config.json';

var currentArtist = '';
var currentTitle = '';

var positionConfigTitle = {}

var positionConfigArtist = {}

var displayConfig = 0;

var loadConfig = function() {
  if (fs.existsSync(recognitionConfigFile)) {
    config = JSON.parse(fs.readFileSync(recognitionConfigFile));
  }

  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var dayName = days[new Date().getDay()];

  for (var i = 0; i < config.override.length; i++) {
    if (config.override[i].day === dayName) {
      const currentHour = new Date().getHours();

      if (currentHour >= config.override[i].time && currentHour < config.override[i].time + config.override[i].length) {
        if (config.override[i].config_override !== undefined) {
          configFile = 'configs/' + config.override[i].config_override;
        }
      }
    }
  }

  if (fs.existsSync(configFile)) {
    positionConfigTitle = JSON.parse(fs.readFileSync(configFile)).title;
    positionConfigArtist = JSON.parse(fs.readFileSync(configFile)).artist;
    displayConfig = JSON.parse(fs.readFileSync(configFile)).display;
  }
}

var recognize = function() {
  loadConfig();

  const dateNow = Date.now() / 1000;
  screenshot.listDisplays().then((displays) => {
    screenshot({
        screen: displays[displays.length - displayConfig].id,
        filename: 'screenshots/screenshot_' + dateNow + '.png'
      })
      .then((imgPath) => {
        sharp(imgPath).extract(positionConfigArtist).toFile('extracted/artist.png').then(() => {
          sharp(imgPath).extract(positionConfigTitle).toFile('extracted/title.png').then(() => {
            fs.unlinkSync(imgPath, function(err) {
              if (err) {
                console.log(err);
              }

              recognize();

            });
          });
        });
      });
  });
}

recognize();