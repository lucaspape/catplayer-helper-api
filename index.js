const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');

const PORT = 5000
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/v1'

const mApiKey = JSON.parse(fs.readFileSync('config.json')).mApiKey;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/', (req, res) => {
  res.status(418);
  res.send("Hello world!!");
});

app.post(APIPREFIX + '/playlist', (req, res) => {
  const playlistId = req.body.playlistId;
  const newSong = req.body.newSong;
  const sid = req.body.sid;

  if(playlistId !== undefined){
    if(newSong !== undefined){
      if(sid !== undefined){
        if(newSong.releaseId !== undefined){
          if(newSong.trackId !== undefined){
            request({
              url: 'https://connect.monstercat.com/v2/playlist/' + playlistId,
              method: 'GET',
              headers: {
                'Cookie': 'connect.sid=' + sid
              }
            }, function(err, resp, body){
              if(err){
                res.send(err);
              }else{
                const jsonResponse = JSON.parse(body)
                const trackArray = jsonResponse.tracks

                const patchObject = {};

                patchObject.tracks = trackArray;
                patchObject.tracks[patchObject.tracks.length] = newSong;

                request({
                  url: 'https://connect.monstercat.com/v2/playlist/' + playlistId,
                  method: 'PATCH',
                  headers: {
                    'Cookie': 'connect.sid=' + sid
                  },
                  json: patchObject
                }, function(patchErr, patchResp, patchBody){
                  if(patchErr){
                    res.send(patchErr);
                  }else{
                    res.json((patchBody));
                  }
                });
              }
            });
          }else{
            res.send("trackId not specified");
          }
        }else{
          res.send("releaseId not specified");
        }
      }else{
        res.send("sid not specified");
      }
    }else{
      res.send("newSong not specified");
    }
  }else{
    res.send("playlistId not specified");
  }
});

app.get(APIPREFIX + '/liveinfo', (req, res) => {
  const {key} = req.query;

  if(key === mApiKey){
   res.send(JSON.parse(fs.readFileSync('currentdata.json')));
  }else{
   res.status(403)
   res.send("Wrong API key!");
  }
});

app.get(APIPREFIX + '/livecover', (req, res) => {
  const {key} = req.query;

  if(key === mApiKey){
    res.sendFile(__dirname + '/cover.png');
  }else{
    res.status(403);
    res.send("Wrong API key!");
  }
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});
