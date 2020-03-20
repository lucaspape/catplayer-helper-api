const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const logAdapter = new FileSync('express-log.json');
const logDB = lowdb(logAdapter);
logDB.defaults({ requests: []})
  .write();

const PORT = 5000;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/v1';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/', (req, res) => {
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/'})
    .write();

  res.status(418);
  res.send("Hello world!!");
});

app.get(APIPREFIX + '/playlist/public', (req,res) =>{
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/playlist/public'})
    .write();

  res.send(JSON.parse(fs.readFileSync('public-playlists.json')));
});

app.post(APIPREFIX + '/playlist/addtrack', (req, res) => {
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/playlist/addtrack'})
    .write();

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

app.post(APIPREFIX + "/playlist/deletetrack", (req,res) => {
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/playlist/deletetrack'})
    .write();

  const playlistId = req.body.playlistId;
  const songDelete = req.body.songDelete;
  const sid = req.body.sid;

  if(playlistId !== undefined){
      if(sid !== undefined){
        if(songDelete.songDeleteIndex !== undefined){
          if(songDelete.releaseId !== undefined){
            if(songDelete.trackId !== undefined){
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

                  if(patchObject.tracks[songDelete.songDeleteIndex].releaseId === songDelete.releaseId){
                    if(patchObject.tracks[songDelete.songDeleteIndex].trackId === songDelete.trackId){
                      patchObject.tracks.splice(songDelete.songDeleteIndex,1);
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
                  }else{
                    res.send("trackId not correct");
                  }
                }else{
                  res.send("releaseId not correct");
                }
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
      res.send("songDeleteIndex not specified");
    }
  }else{
    res.send("playlistId not specified");
  }
});

app.get(APIPREFIX + '/liveinfo', (req, res) => {
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/liveinfo'})
    .write();

  res.send(JSON.parse(fs.readFileSync('currentdata.json')));
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});