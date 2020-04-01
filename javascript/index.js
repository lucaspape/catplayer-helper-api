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


app.get(APIPREFIX + '/liveinfo', (req, res) => {
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/liveinfo'})
    .write();

  res.send(JSON.parse(fs.readFileSync('currentdata.json')));
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});
