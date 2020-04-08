const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/v1';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/', (req, res) => {
  res.status(418);
  res.send("Hello world!!");
});

app.get(APIPREFIX + '/playlist/public', (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('public-playlists.json')));
  } catch (e) {
    res.send(e);
  }
});


app.get(APIPREFIX + '/liveinfo', (req, res) => {
  try {
    res.send(JSON.parse(fs.readFileSync('currentdata.json')));
  } catch (e) {
    res.send(e);
  }
});

app.get(APIPREFIX + '/catalog', (req, res) => {
  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.user !== undefined) {
          hasGold = json.gold;
        }

        request({
          url: 'http://proxy-internal/catalog?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
          method: 'GET'
        }, function(err, resp, body) {
          if (err) {
            res.send(err);
          } else {
            try {
              res.send(JSON.parse(body));
            } catch (e) {
              console.log(e);
            }
          }
        });
      },
      function(err) {
        res.send(err);
      });
  });
});

app.get(APIPREFIX + '/releases', (req, res) => {
  utils.fixSkipAndLimit(req.query, function(skip, limit) {
    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.user !== undefined) {
          hasGold = json.gold;
        }

        request({
            url: 'http://proxy-internal/releases?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
            method: 'GET'
          },
          function(err, resp, body) {
            if (err) {
              res.send(err);
            } else {
              try {
                res.send(JSON.parse(body));
              } catch (e) {
                res.send(e);
              }
            }
          });
      },
      function(err) {
        res.send(err);
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
          res.send(err);
        } else {
          try {
            res.send(JSON.parse(body));
          } catch (e) {
            res.send(e);
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

        if (json.user !== undefined) {
          hasGold = json.gold;
        }

        request({
            url: 'http://proxy-internal/catalog/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
            method: 'GET'
          },
          function(err, resp, body) {
            if (err) {
              res.send(err);
            } else {
              try {
                res.send(JSON.parse(body));
              } catch (e) {
                res.send(e);
              }
            }
          });
      },
      function(err) {
        res.send(err);
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

        if (json.user !== undefined) {
          hasGold = json.gold;
        }

        request({
            url: 'http://proxy-internal/releases/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
            method: 'GET'
          },
          function(err, resp, body) {
            if (err) {
              res.send(err);
            } else {
              try {
                res.send(JSON.parse(body));
              } catch (e) {
                res.send(e);
              }
            }
          });
      },
      function(err) {
        res.send(err);
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
          res.send(err);
        } else {
          try {
            res.send(JSON.parse(body));
          } catch (e) {
            res.send(e);
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
      url: 'http://database-session/session',
      method: 'POST',
      json: true,
      body: {
        sid: sid
      }
    }, function(err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        console.log(body);
        callback(JSON.parse(body));
      }
    });
  } else {
    callback({});
  }
}