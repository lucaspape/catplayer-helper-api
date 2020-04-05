const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const lowdb = require('lowdb');
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

app.get(APIPREFIX + '/catalog/browse', (req, res) => {
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

  request({
      url: 'http://database:6000/v1/catalog/browse?limit=' + limit + '&skip=' + skip,
      method: 'GET'
    },
    function(err, resp, body) {
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.parse(body));
      }
    });
});

app.get(APIPREFIX + '/catalog/search', (req, res) => {
  logDB.get('requests')
    .push({
      time: Math.floor(new Date()),
      url: '/catalog/browse'
    })
    .write();

  const searchString = req.query.term.replace(/[^ -~]+/g, "");

  request({
      url: 'http://database:6000/v1/catalog/search?term=' + searchString,
      method: 'GET'
    },
    function(err, resp, body) {
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.parse(body));
      }
    });
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});