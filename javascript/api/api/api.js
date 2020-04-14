const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const useragent = require('express-useragent');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/monstercat/v1';

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
  request({
    url: 'http://proxy-internal/related',
    method: 'POST',
    json: true,
    body: req.body
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
          res.redirect("https://api.lucaspape.de/monstercat/v1/static/release/" + releaseId + '/' + JSON.parse(body).filename);
        } catch (e) {
          res.status(500).send(e);
        }
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