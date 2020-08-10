const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const useragent = require('express-useragent');
const utils = require('./utils.js');
const {stat, createReadStream} = require('fs');
const {pipeline} = require('stream');

const config = JSON.parse(fs.readFileSync('server_config.json', 'utf8'));

const PORT = 80;

const public = config.public;

const PREFIX = '/';
const APIPREFIX = PREFIX + '/v1';
const APIV2PREFIX = PREFIX + '/v2';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(useragent.express());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(function(req, res, next) {
  var url = req.originalUrl;

  if (url.includes('term=')) {
    url = url.substring(0, url.indexOf('term='))
  }

  log(url, req.useragent.source, function() {
    next();
  });
});

app.post(APIV2PREFIX + '/signin', async(req,res) =>{
  console.log('Signin!');

  request({
    url: 'http://proxy-internal/login',
    method: 'POST',
    json: true,
    body: {email:req.body.email, password:req.body.password}
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const sid = body.sid;

      if(sid){
        res.cookie('connect.sid', sid, { maxAge: 900000});
        res.status(200).send('OK');
      }else{
        res.status(401).send('Error');
      }
    } else {
      res.status(401).send(error);
    }
  });
});

app.post(APIV2PREFIX + '/register', async(req,res) =>{
  request({
    url: 'http://proxy-internal/register',
    method: 'POST',
    json: true,
    body: {email:req.body.email, password:req.body.password, privilegeLevel: 0}
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.status(200).send(body);
    } else {
      res.status(500).send(error);
    }
  });
});

app.get(APIV2PREFIX + '/session', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(200).send({user:{
      id: 'sampleId',
      email: 'sampleEmail'
    }});
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.patch(APIV2PREFIX + '/playlist/:playlistId/record', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.delete(APIV2PREFIX + '/playlist/:playlistId/record', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIV2PREFIX + '/playlist/:playlistId/catalog', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIV2PREFIX + '/playlist/:playlistId', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.patch(APIV2PREFIX + '/playlist/:playlistId', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.delete(APIV2PREFIX + '/playlist/:playlistId', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIV2PREFIX + '/playlists', async (req, res) => {
  if(await authenticated(req.cookies)){
    request({
      url: 'http://proxy-internal/session',
      method: 'POST',
      json: true,
      body: {sid: req.cookies['connect.sid']}
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        if(body){
          if(body.email){
            request({
              url: 'http://proxy-internal/user?email=' + body.email,
              method: 'GET'
            }, function(err, resp, body) {
              if (err) {
                res.status(500).send(err);
              } else {
                try {
                  const json = JSON.parse(body);
                  if(json.userId){
                    console.log('Requesting playlist');

                    request({
                      url: 'http://proxy-internal/playlists?userId=' + json.userId,
                      method: 'GET'
                    }, function(err, resp, body) {
                      if (err) {
                        res.status(500).send(err);
                      } else {
                        try {
                          res.send(JSON.parse(body));
                        } catch (e) {
                          res.status(500).send(e);
                        }
                      }
                    });
                  }
                } catch (e) {
                  res.status(500).send(e);
                }
              }
            });
          }else{
            res.status(500).send('Could not find user');
          }
        }else{
          res.status(500).send('Error');
        }
      } else {
        res.status(500).send(error);
      }
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.post(APIV2PREFIX + '/playlist', async (req, res) => {
  if(await authenticated(req.cookies)){
    res.status(500).send('Not implemented!');
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/', async (req, res) => {
  res.status(418);
  res.send("Hello world!!");
});

app.get(PREFIX + '/features', async (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('static/api_features.json')));
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get(APIPREFIX + '/stats', async (req, res) => {
  request({
    url: 'http://proxy-internal/log',
    method: 'GET'
  }, function(err, resp, body) {
    if (err) {
      res.status(500).send(err);
    } else {
      try {
        res.send(JSON.parse(body));
      } catch (e) {
        res.status(500).send(e);
      }
    }
  });
});

app.get(APIPREFIX + '/playlist/public', async (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('static/public-playlists.json')));
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post(APIPREFIX + '/related', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    const skipMonstercatTracks = (req.query.skipMC === 'true');

    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      request({
        url: 'http://proxy-internal/related?skip=' + skip + '&limit=' + limit + "&skipMC=" + skipMonstercatTracks,
        method: 'POST',
        json: true,
        body: {
          tracks: req.body.tracks,
          exclude: req.body.exclude
        }
      }, function(err, resp, body) {
        if (err) {
          res.status(500).send(err);
        } else {
          try {
            res.send(body);
          } catch (e) {
            res.status(500).send(e);
          }
        }
      });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/catalog/release/:mcID', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    const mcID = req.params.mcID;

    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.gold !== undefined) {
          hasGold = json.gold;
        }

        request({
          url: 'http://proxy-internal/catalog/release/' + mcID + '?gold=' + hasGold,
          method: 'GET'
        }, function(err, resp, body) {
          if (err) {
            res.status(500).send(err);
          } else {
            try {
              res.send(JSON.parse(body));
            } catch (e) {
              res.status(500).send(e);
            }
          }
        });
      },
      function(err) {
        res.status(500).send(err);
      });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/release/:releaseId/cover', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    const releaseId = req.params.releaseId;
    const image_width = req.query.image_width;

    request({
        url: 'http://proxy-internal/release/' + releaseId + '/cover?img_width=' + image_width,
        method: 'GET'
      },
      function(err, resp, body) {
        if (err) {
          res.status(500).send(err);
        } else {
          try {
            //TODO change this URL
            res.redirect(config.public_api_address + config.apiprefix + "/v1/static/release/" + releaseId + '/' + JSON.parse(body).filename);
          } catch (e) {
            res.status(500).send(e);
          }
        }
      });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/release/:releaseId/track-stream/:songId', async (req, res) =>{
  if(public || await authenticated(req.cookies)){
    const releaseId = req.params.releaseId;
    const songId = req.params.songId;

    const songFile = __dirname + '/../static-private/release/' + releaseId + '/track-download/' + songId + '.mp3';

    fs.stat(songFile, (err, stat) => {
      if(err){
        console.log(err);
        res.status(404).send(err);
      }

      const size = stat.size;

      const range = req.headers.range;

      if(range){
        /** Extracting Start and End value from Range Header */
        let [start, end] = range.replace(/bytes=/, "").split("-");
        start = parseInt(start, 10);
        end = end ? parseInt(end, 10) : size - 1;

        if (!isNaN(start) && isNaN(end)) {
          start = start;
          end = size - 1;
        }
        if (isNaN(start) && !isNaN(end)) {
          start = size - end;
          end = size - 1;
        }

        // Handle unavailable range request
        if (start >= size || end >= size) {
          // Return the 416 Range Not Satisfiable.
          res.writeHead(416, {
            "Content-Range": `bytes */${size}`
          });
          return res.end();
        }

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': 'audio/mp3'
        });

        let readable = createReadStream(songFile, {start:start, end:end});

        pipeline(readable, res, err => {
          console.log(err);
        });
      }else{
        res.writeHead(200, {
          "Content-Length": size,
          "Content-Type": "audio/mp3"
        });

        let readable = createReadStream(songFile);
        pipeline(readable, res, err => {
          console.log(err);
        });
      }
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/release/:releaseId/track-download/:songId', async (req, res) =>{
  if(public || await authenticated(req.cookies)){
    const releaseId = req.params.releaseId;
    const songId = req.params.songId;

    var format = req.query.format;

    if(!format){
      format = 'mp3';
    }

    const songFile = __dirname + '/../static-private/release/' + releaseId + '/track-download/' + songId + '.' + format;

    fs.stat(songFile, (err, stat) => {
      if(err){
        console.log(err);
        res.status(404).send(err);
      }

      const size = stat.size;

      res.writeHead(200, {
        "Content-Length": size,
        "Content-Type": "audio/" + format
      });

      let readable = createReadStream(songFile);
      pipeline(readable, res, err => {
        console.log(err);
      });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/catalog', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      const sid = req.cookies['connect.sid'];

      getSession(sid,
        function(json) {
          var hasGold = false;

          if (json.gold !== undefined) {
            hasGold = json.gold;
          }

          request({
            url: 'http://proxy-internal/catalog?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
            method: 'GET'
          }, function(err, resp, body) {
            if (err) {
              res.status(500).send(err);
            } else {
              try {
                res.send(JSON.parse(body));
              } catch (e) {
                res.status(500).send(e);
              }
            }
          });
        },
        function(err) {
          res.status(500).send(err);
        });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/releases', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      const sid = req.cookies['connect.sid'];

      getSession(sid,
        function(json) {
          var hasGold = false;

          if (json.gold !== undefined) {
            hasGold = json.gold;
          }

          request({
              url: 'http://proxy-internal/releases?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
              method: 'GET'
            },
            function(err, resp, body) {
              if (err) {
                res.status(500).send(err);
              } else {
                try {
                  res.send(JSON.parse(body));
                } catch (e) {
                  res.status(500).send(e);
                }
              }
            });
        },
        function(err) {
          res.status(500).send(err);
        });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/artists', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      request({
          url: 'http://proxy-internal/artists?limit=' + limit + '&skip=' + skip,
          method: 'GET'
        },
        function(err, resp, body) {
          if (err) {
            res.status(500).send(err);
          } else {
            try {
              res.send(JSON.parse(body));
            } catch (e) {
              res.status(500).send(e);
            }
          }
        });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/catalog/search', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    var searchString = utils.fixSearchString(req.query.term);

    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      const sid = req.cookies['connect.sid'];

      getSession(sid,
        function(json) {
          var hasGold = false;

          if (json.gold !== undefined) {
            hasGold = json.gold;
          }

          request({
              url: 'http://proxy-internal/catalog/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
              method: 'GET'
            },
            function(err, resp, body) {
              if (err) {
                res.status(500).send(err);
              } else {
                try {
                  res.send(JSON.parse(body));
                } catch (e) {
                  res.status(500).send(e);
                }
              }
            });
        },
        function(err) {
          res.status(500).send(err);
        });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/releases/search', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    var searchString = utils.fixSearchString(req.query.term);

    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      const sid = req.cookies['connect.sid'];

      getSession(sid,
        function(json) {
          var hasGold = false;

          if (json.gold !== undefined) {
            hasGold = json.gold;
          }

          request({
              url: 'http://proxy-internal/releases/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
              method: 'GET'
            },
            function(err, resp, body) {
              if (err) {
                res.status(500).send(err);
              } else {
                try {
                  res.send(JSON.parse(body));
                } catch (e) {
                  res.status(500).send(e);
                }
              }
            });
        },
        function(err) {
          res.status(500).send(err);
        });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.get(APIPREFIX + '/artists/search', async (req, res) => {
  if(public || await authenticated(req.cookies)){
    var searchString = utils.fixSearchString(req.query.term);

    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      request({
          url: 'http://proxy-internal/artists/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip,
          method: 'GET'
        },
        function(err, resp, body) {
          if (err) {
            res.status(500).send(err);
          } else {
            try {
              res.send(JSON.parse(body));
            } catch (e) {
              res.status(500).send(e);
            }
          }
        });
    });
  }else{
    res.status(401).send('Unauthorized');
  }
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

function getSession(sid, callback, errorCallback) {
  if (sid !== undefined) {
    request({
      url: 'http://proxy-internal/session',
      method: 'POST',
      json: true,
      body: {
        sid: sid
      }
    }, function(err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        callback(body);
      }
    });
  } else {
    callback({});
  }
}


//basic authentication level
function authenticated(cookies){
  return new Promise(function (resolve, reject) {
    request({
      url: 'http://proxy-internal/session',
      method: 'POST',
      json: true,
      body: {sid: cookies['connect.sid']}
      }, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        if(body){
          if(body.basicAuthentication){
            console.log('client has basic authentication');
            resolve(body.basicAuthentication);
          }else{
            resolve(false);
          }
        }else{
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  });
}

function log(url, userAgent, callback) {
  request({
    url: 'http://proxy-internal/log',
    method: 'POST',
    json: true,
    body: {
      url: url,
      userAgent: userAgent
    }
  }, function(err, resp, body) {
    callback(body);
  });
}
