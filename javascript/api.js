const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
const cookieParser = require('cookie-parser');
const FileSync = require('lowdb/adapters/FileSync');

const logAdapter = new FileSync('express-log.json');
const logDB = lowdb(logAdapter);
logDB.defaults({
    requests: []
  })
  .write();

const PORT = 5000;
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
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/'
    })
    .write();

  res.status(418);
  res.send("Hello world!!");
});

app.get(APIPREFIX + '/playlist/public', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/playlist/public'
    })
    .write();

  res.send(JSON.parse(fs.readFileSync('public-playlists.json')));
});


app.get(APIPREFIX + '/liveinfo', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/liveinfo'
    })
    .write();

  res.send(JSON.parse(fs.readFileSync('currentdata.json')));
});

app.get(APIPREFIX + '/catalog', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/catalog/browse'
    })
    .write();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  const sid = req.cookies['connect.sid'];

  getSession(sid,
    function(json) {
      var hasGold = false;

      if (json.user !== undefined) {
        hasGold = json.user.hasGold;
      }

      request({
        url: 'http://database:6000/v1/catalog?limit=' + limit + '&skip=' + skip + '&gold=' + hasGold,
        method: 'GET'
      }, function(err, resp, body) {
        if (err) {
          res.send(err);
        } else {
          var trackArray = JSON.parse(body).results;

          var returnObject = {
            results: trackArray
          };

          res.send(returnObject);
        }
      });
    },
    function(err) {
      res.send(err);
    });
});

app.get(APIPREFIX + '/releases', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/releases'
    })
    .write();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  const sid = req.cookies['connect.sid'];

  getSession(sid,
    function(json) {
      var hasGold = false;

      if (json.user !== undefined) {
        hasGold = json.user.hasGold;
      }

      request({
          url: 'http://database:6000/v1/releases?limit=' + limit + '&skip=' + skip + '&gold=' + gold,
          method: 'GET'
        },
        function(err, resp, body) {
          if (err) {
            res.send(err);
          } else {
            var releasesArray = JSON.parse(body).results;
            var returnObject = {
              results: releasesArray
            };

            res.send(returnObject);
          }
        });
    },
    function(err) {
      res.send(err);
    });
});

app.get(APIPREFIX + '/artists', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/artists'
    })
    .write();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  request({
      url: 'http://database:6000/v1/artists?limit=' + limit + '&skip=' + skip,
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

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/catalog/search'
    })
    .write();

  var searchString = req.query.term.replace(/[^\x20-\x7E]/g, "");
  searchString = searchString.replace('(', '%7B');
  searchString = searchString.replace(')', '%7D');
  searchString = searchString.replace(' ', '%20');
  searchString = searchString.trim();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  const sid = req.cookies['connect.sid'];

  getSession(sid,
    function(json) {
      var hasGold = false;

      if (json.user !== undefined) {
        hasGold = json.user.hasGold;
      }

      request({
          url: 'http://database:6000/v1/catalog/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
          method: 'GET'
        },
        function(err, resp, body) {
          if (err) {
            res.send(err);
          } else {
            var trackArray = JSON.parse(body).results;

            var returnObject = {
              results: trackArray
            };

            res.send(returnObject);
          }
        });
    },
    function(err) {
      res.send(err);
    });
});

app.get(APIPREFIX + '/releases/search', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/releases/search'
    })
    .write();

  var searchString = req.query.term.replace(/[^\x20-\x7E]/g, "");
  searchString = searchString.replace('(', '%7B');
  searchString = searchString.replace(')', '%7D');
  searchString = searchString.replace(' ', '%20');
  searchString = searchString.trim();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  const sid = req.cookies['connect.sid'];

  getSession(sid,
    function(json) {
      var hasGold = false;

      if (json.user !== undefined) {
        hasGold = json.user.hasGold;
      }

      request({
          url: 'http://database:6000/v1/releases/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip + '&gold=' + hasGold,
          method: 'GET'
        },
        function(err, resp, body) {
          if (err) {
            res.send(err);
          } else {
            var releasesArray = JSON.parse(body).results;

            var returnObject = {
              results: releasesArray
            };

            res.send(returnObject);
          }
        });
    },
    function(err) {
      res.send(err);
    });
});

app.get(APIPREFIX + '/artists/search', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/artists/search'
    })
    .write();

  var searchString = req.query.term.replace(/[^\x20-\x7E]/g, "");
  searchString = searchString.replace('(', '%7B');
  searchString = searchString.replace(')', '%7D');
  searchString = searchString.replace(' ', '%20');
  searchString = searchString.trim();

  var skip = 0;
  var limit = 50;

  if (req.query.skip !== undefined) {
    skip = parseInt(req.query.skip);
  }

  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  request({
      url: 'http://database:6000/v1/artists/search?term=' + searchString + "&limit=" + limit + "&skip=" + skip,
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

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

var sessionCache = [];

function getSession(sid, callback, errorCallback) {
  if (sessionCache[sid] === undefined) {
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
        const json = JSON.parse(body)
        sessionCache[sid] = json;
        callback(json);
      }
    });
  } else {
    callback(sessionCache[sid]);
  }
}