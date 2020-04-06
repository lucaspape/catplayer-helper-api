const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const cookieParser = require('cookie-parser');

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
  res.send(JSON.parse(fs.readFileSync('public-playlists.json')));
});


app.get(APIPREFIX + '/liveinfo', (req, res) => {
  res.send(JSON.parse(fs.readFileSync('currentdata.json')));
});

app.get(APIPREFIX + '/catalog', (req, res) => {
  fixSkipAndLimit(req.query, function(skip, limit) {
    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.user !== undefined) {
          hasGold = json.user.hasGold;
        }

        request({
          url: 'http://database-catalog/v1/catalog?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
          method: 'GET'
        }, function(err, resp, body) {
          if (err) {
            res.send(err);
          } else {
            res.send(JSON.parse(body));
          }
        });
      },
      function(err) {
        res.send(err);
      });
  });
});

app.get(APIPREFIX + '/releases', (req, res) => {
  fixSkipAndLimit(req.query, function(skip, limit) {
    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.user !== undefined) {
          hasGold = json.user.hasGold;
        }

        request({
            url: 'http://database-releases/v1/releases?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
            method: 'GET'
          },
          function(err, resp, body) {
            if (err) {
              res.send(err);
            } else {
              res.send(JSON.parse(body));
            }
          });
      },
      function(err) {
        res.send(err);
      });
  });
});

app.get(APIPREFIX + '/artists', (req, res) => {
  fixSkipAndLimit(req.query, function(skip, limit) {
    request({
        url: 'http://database-artists/v1/artists?limit=' + limit + '&skip=' + skip,
        method: 'GET'
      },
      function(err, resp, body) {
        if (err) {
          res.send(err);
        } else {
          res.send(JSON.parse(body));
        }
      });
  });
});

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  var searchString = fixSearchString(req.query.term);

  fixSkipAndLimit(req.query, function(skip, limit) {
    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.user !== undefined) {
          hasGold = json.user.hasGold;
        }

        request({
            url: 'http://database-catalog/v1/catalog/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
            method: 'GET'
          },
          function(err, resp, body) {
            if (err) {
              res.send(err);
            } else {
              res.send(JSON.parse(body));
            }
          });
      },
      function(err) {
        res.send(err);
      });
  });
});

app.get(APIPREFIX + '/releases/search', (req, res) => {
  var searchString = fixSearchString(req.query.term);

  fixSkipAndLimit(req.query, function(skip, limit) {
    const sid = req.cookies['connect.sid'];

    getSession(sid,
      function(json) {
        var hasGold = false;

        if (json.user !== undefined) {
          hasGold = json.user.hasGold;
        }

        request({
            url: 'http://database-releases/v1/releases/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
            method: 'GET'
          },
          function(err, resp, body) {
            if (err) {
              res.send(err);
            } else {
              res.send(JSON.parse(body));
            }
          });
      },
      function(err) {
        res.send(err);
      });
  });
});

app.get(APIPREFIX + '/artists/search', (req, res) => {
  var searchString = fixSearchString(req.query.term);

  fixSkipAndLimit(req.query, function(skip, limit) {
    request({
        url: 'http://database-artists/v1/artists/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip,
        method: 'GET'
      },
      function(err, resp, body) {
        if (err) {
          res.send(err);
        } else {
          res.send(JSON.parse(body));
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
      url: 'https://connect.monstercat.com/v2/self/session',
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=' + sid
      }
    }, function(err, resp, body) {
      if (err) {
        errorCallback(err);
      } else {
        callback(JSON.parse(body));
      }
    });
  } else {
    callback({});
  }
}

function fixSearchString(searchString) {
  searchString = searchString.replace(/[^\x20-\x7E]/g, "");
  searchString = searchString.replace('(', '%7B');
  searchString = searchString.replace(')', '%7D');
  searchString = searchString.replace(' ', '%20');
  searchString = searchString.trim();

  return searchString;
}

function fixSkipAndLimit(reqQuery, callback) {
  var skip = 0;
  var limit = 50;

  if (reqQuery.skip !== undefined) {
    skip = parseInt(reqQuery.skip);
  }

  if (reqQuery.limit !== undefined) {
    limit = parseInt(reqQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  callback(skip, limit);
}