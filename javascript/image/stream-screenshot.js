const { exec } = require("child_process");
const fs = require('fs');
const sharp = require('sharp');
const request = require('request');

const githubRecognitionConfigFile = 'https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/image/configs/config_recognition.json'
const recognitionConfigFile = 'configs/config_recognition.json';

var config = {};

var githubConfigFile = 'https://raw.githubusercontent.com/lucaspape/catplayer-helper-api/master/javascript/image/configs/config.json'
var configFile = 'configs/config.json';

var positionConfigTitle = {}

var positionConfigArtist = {}

function screenshotStream() {
    //TODO use Twitch API
    const streamUrl = 'https://video-weaver.fra05.hls.ttvnw.net/v1/playlist/CtcDavjx21NLRcNhOofK9zE9KRzJGZEDrk9TyAgWtgEeK9cD1QmmX4X5klUuqaDdlaCJUlWRg4XSbDEghFeCCdMmaIZpuzyu6zHZOjusRPcXwNrBmcwSNJgG67LSgtPQN6pfjXCCie6KKFKg9TgDu89nWTfoyaNk4b-d2HpjNx3jPk5zF7kf1miPeK9O4GX0nxhHVTijWD1uKTFoCdY_Qjj_P_fP0T2hH3iIqrhdp4cYvMYnMoeO-91tLOHq7R7e_U6GhpZrT6yW0qDpjvo9bCtNtzfanwEe6JvQyl-l6tkyr_QgS9rPU55dD0NZ0DDrT983Di4pXFYFMlIzVw1PGXrBX8dHXPFgRr0mfyZFRJIk_BFIPtfSsXPmEA1_bA0joG9bNT2628odi7FTKNdSo29Bccil0Pht5IukWT3ExRt8uwe1dxsEIOK2k9IesV19U1YibwwNSx1zFmUFDS5jm3DKRyUEUxiG1IMHoaI1XvhRN99ley9KFWFJXwuOqYMAGxzOgfcjZFwoc9WRr1iEvEFaWLBBD4c4NOwR2KLmh648LrU4jyzOBR4EAPNaVlZWIrNojaS0Q2WKviQSWVp5aUYyLFs4wC0VXnm41GDLb3S5TG_obWRZ7MEIEhCD_fDL0xp0WMeMoGg0t-ylGgxzKIkmlvC-fQmbG4E.m3u8';
    const imgPath = 'screenshots/stream-screenshot.png'

    exec('ffmpeg -i ' + streamUrl + ' -f image2 -vframes 1 ' + imgPath, (error, stdout, stderr) => {
        loadConfig(function () {
            sharp(imgPath).extract(positionConfigArtist).toFile('screenshots/artist.png').then(() => {
                sharp(imgPath).extract(positionConfigTitle).toFile('screenshots/title.png').then(() => {
                    fs.unlinkSync(imgPath, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
            });
        });
    });
}

function loadConfig(callback) {
    download(githubRecognitionConfigFile,
        'configs/config_recognition.json',
        function () {
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
                            configFile = 'scripts/configs/' + config.override[i].config_override;
                        }
                    }
                }
            }

            download(githubConfigFile, configFile, function () {
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

screenshotStream();
