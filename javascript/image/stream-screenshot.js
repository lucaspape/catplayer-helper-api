const { exec } = require("child_process");
const fs = require('fs');
const sharp = require('sharp');
const request = require('request');

const scheduleConfigUrl = 'https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/image/configs/config_schedule.json'
const scheduleConfigFile = 'configs/config_schedule.json';

var config = {};

var configFileUrl = 'https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/image/configs/config.json'
var configFile = 'configs/config.json';

var positionConfigTitle = {}

var positionConfigArtist = {}

function getStreamUrl(callback){
  exec('streamlink twitch.tv/monstercat 1080p --stream-url', (error, stdout, stderr) => {
    screenshotStream(stdout.replace(/\r?\n|\r/g, ' '), callback);
  });
}

getStreamUrl(function(){
  setTimeout(function(){
    console.log('Done!');
  }, 5000);
});

function screenshotStream(streamUrl, callback) {
    const imgPath = 'screenshots/stream-screenshot.png'
    const ffmpeg = 'ffmpeg -y -i ' + streamUrl + ' -f image2 -vframes 1 ' + imgPath;

    exec(ffmpeg, (error, stdout, stderr) => {
        loadConfig(function () {
            sharp(imgPath).extract(positionConfigArtist).toColourspace('b-w').toFile('screenshots/artist.png').then(() => {
                sharp(imgPath).extract(positionConfigTitle).toColourspace('b-w').toFile('screenshots/title.png').then(() => {
                    callback();
                });
            });
        });
    });
}

function loadConfig(callback) {
    download(scheduleConfigUrl,
        scheduleConfigFile,
        function () {
            if (fs.existsSync(scheduleConfigFile)) {
                config = JSON.parse(fs.readFileSync(scheduleConfigFile));
            }

            var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            var dayName = days[new Date().getDay()];

            for (var i = 0; i < config.override.length; i++) {
                if (config.override[i].day === dayName) {
                    const currentHour = new Date().getHours();

                    if (currentHour >= config.override[i].time && currentHour < config.override[i].time + config.override[i].length) {
                        if (config.override[i].config_override !== undefined) {
                            configFile = 'scripts/configs/' + config.override[i].config_override;
                        }
                    }
                }
            }

            download(configFileUrl, configFile, function () {
                if (fs.existsSync(configFile)) {
                    positionConfigTitle = JSON.parse(fs.readFileSync(configFile)).title;
                    positionConfigArtist = JSON.parse(fs.readFileSync(configFile)).artist;
                    displayConfig = JSON.parse(fs.readFileSync(configFile)).display;
                }

                callback();
            });
        });
}

function download(uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}
