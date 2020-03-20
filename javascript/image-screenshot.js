const screenshot = require('screenshot-desktop');
const fs = require('fs');
const sharp = require('sharp');
const tesseract = require('node-tesseract-ocr');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const configFile = 'configs/config.json';

var currentArtist = '';
var currentTitle = '';

var positionConfigTitle = {}

var positionConfigArtist = {}

var displayConfig = 0;

if(fs.existsSync(configFile)){
  positionConfigTitle = JSON.parse(fs.readFileSync(configFile)).title;
  positionConfigArtist = JSON.parse(fs.readFileSync(configFile)).artist;
  displayConfig = JSON.parse(fs.readFileSync(configFile)).display;
}

var recognize = function(){
  const dateNow = Date.now() / 1000;
  screenshot.listDisplays().then((displays) => {
    screenshot({ screen: displays[displays.length - displayConfig].id, filename: 'screenshots/screenshot_' + dateNow + '.png' })
      .then((imgPath) => {
        sharp(imgPath).extract(positionConfigArtist).toFile('extracted/artist.png').then( () => {
          sharp(imgPath).extract(positionConfigTitle).toFile('extracted/title.png').then( () => {
              fs.unlinkSync(imgPath, function(err){
                  if(err){
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
