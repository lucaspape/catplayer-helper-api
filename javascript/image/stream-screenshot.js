const { exec } = require("child_process");
const fs = require('fs');
const sharp = require('sharp');
const request = require('request');

const scheduleConfigUrl = 'https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/image/configs/config_schedule.json'
const scheduleConfigFile = 'configs/config_schedule.json';

var config = {};

//var configFileUrl = 'https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/image/configs/config.json'
var configFile = 'configs/config.json';

var positionConfigTitle = {}

var positionConfigArtist = {}

function screenshotStream() {
    //TODO use Twitch API
    const streamUrl = 'https://video-weaver.fra05.hls.ttvnw.net/v1/playlist/CtcDavjx21NLRcNhOofK9zE9KRzJGZEDrk9TyAgWtgEeK9cD1QmmX4X5klUuqaDdlaCJUlWRg4XSbDEghFeCCdMmaIZpuzyu6zHZOjusRPcXwNrBmcwSNJgG67LSgtPQN6pfjXCCie6KKFKg9TgDu89nWTfoyaNk4b-d2HpjNx3jPk5zF7kf1miPeK9O4GX0nxhHVTijWD1uKTFoCdY_Qjj_P_fP0T2hH3iIqrhdp4cYvMYnMoeO-91tLOHq7R7e_U6GhpZrT6yW0qDpjvo9bCtNtzfanwEe6JvQyl-l6tkyr_QgS9rPU55dD0NZ0DDrT983Di4pXFYFMlIzVw1PGXrBX8dHXPFgRr0mfyZFRJIk_BFIPtfSsXPmEA1_bA0joG9bNT2628odi7FTKNdSo29Bccil0Pht5IukWT3ExRt8uwe1dxsEIOK2k9IesV19U1YibwwNSx1zFmUFDS5jm3DKRyUEUxiG1IMHoaI1XvhRN99ley9KFWFJXwuOqYMAGxzOgfcjZFwoc9WRr1iEvEFaWLBBD4c4NOwR2KLmh648LrU4jyzOBR4EAPNaVlZWIrNojaS0Q2WKviQSWVp5aUYyLFs4wC0VXnm41GDLb3S5TG_obWRZ7MEIEhCD_fDL0xp0WMeMoGg0t-ylGgxzKIkmlvC-fQmbG4E.m3u8';
    const imgPath = 'screenshots/stream-screenshot.png'

    setTimeout(function(){
      exec('ffmpeg -y -i ' + streamUrl + ' -f image2 -vframes 1 ' + imgPath, (error, stdout, stderr) => {
          loadConfig(function () {
              sharp(imgPath).extract(positionConfigArtist).toColourspace('b-w').toFile('screenshots/artist.png').then(() => {
                  sharp(imgPath).extract(positionConfigTitle).toColourspace('b-w').toFile('screenshots/title.png').then(() => {

                  });
              });
          });
      });
    }, 5000);
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

            if (fs.existsSync(configFile)) {
                positionConfigTitle = JSON.parse(fs.readFileSync(configFile)).title;
                positionConfigArtist = JSON.parse(fs.readFileSync(configFile)).artist;
                displayConfig = JSON.parse(fs.readFileSync(configFile)).display;
            }

            callback();

        //    download(configFileUrl, configFile, function () {
        //        if (fs.existsSync(configFile)) {
      //              positionConfigTitle = JSON.parse(fs.readFileSync(configFile)).title;
      //              positionConfigArtist = JSON.parse(fs.readFileSync(configFile)).artist;
      //              displayConfig = JSON.parse(fs.readFileSync(configFile)).display;
      //          }

      //          callback();
      //      });
        });
}

function download(uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

screenshotStream();
