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

const PORT = 80;

const PREFIX = '/custom'
const APIPREFIX = PREFIX + '/v1';

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

app.get(APIPREFIX + '/', (req, res) => {
  res.status(418);
  res.send("Hello world!!");
});

app.get(PREFIX + '/features', (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('static/api_features.json')));
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get(APIPREFIX + '/stats', (req, res) => {
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

app.get(APIPREFIX + '/playlist/public', (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('static/public-playlists.json')));
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get(APIPREFIX + '/liveinfo', (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('static/liveinfo.json')));
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post(APIPREFIX + '/related', (req, res) => {
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
});

app.get(APIPREFIX + '/catalog/release/:mcID', (req, res) => {
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
});

app.get(APIPREFIX + '/release/:releaseId/cover', (req, res) => {
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
          res.redirect("https://api.lucaspape.de/custom/v1/static/release/" + releaseId + '/' + JSON.parse(body).filename);
        } catch (e) {
          res.status(500).send(e);
        }
      }
    });
});

app.get(APIPREFIX + '/release/:releaseId/track-stream/:songId', (req, res) =>{
  const releaseId = req.params.releaseId;
  const songId = req.params.songId;

  const songFile = __dirname + '/../static/release/' + releaseId + '/track-stream/' + songId;

  fs.stat(songFile, (err, stat) => {
    if(err){
      console.log(err);
      res.status(404).send(err);
    }

    const size = stat.size;

    const range = req.headers.range;

    if(range){
      let [start, end] = range.replace(/bytes=/, "").split("-");
      start = parseInt(start, 10);
      end = end ? parseInt(end, 10) : size - 1;

      if(!isNaN(start) && isNaN(end)){
        start = start;
        end = size - 1;
      }

      if(isNaN(start) && !isNaN(end)){
        start = size - end;
        end = size - 1;
      }

      if(start >= size || end >= size){
        res.writeHead(416, {'Content-Range': `bytes */${size}`});
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
});

app.get(APIPREFIX + '/catalog', (req, res) => {
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
});

app.get(APIPREFIX + '/releases', (req, res) => {
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
});

app.get(APIPREFIX + '/artists', (req, res) => {
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
});

app.get(APIPREFIX + '/catalog/search', (req, res) => {
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
});

app.get(APIPREFIX + '/releases/search', (req, res) => {
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
});

app.get(APIPREFIX + '/artists/search', (req, res) => {
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
