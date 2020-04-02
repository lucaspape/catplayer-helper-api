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

const catalogDBAdapter = new FileSync('catalog-db.json');
const catalogDB = lowdb(catalogDBAdapter);
catalogDB.defaults({ tracks: []})
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

app.get(APIPREFIX + '/catalog/browse', (req,res) =>{
  logDB.get('requests')
    .push({ time: Math.floor(new Date()), url: '/catalog/browse'})
    .write();

  var skip = parseInt(req.query.skip);
  var limit = parseInt(req.query.limit);

  if(skip === undefined){
    skip = 0;
  }

  if(limit > 50 || limit === undefined){
    limit = 50;
  }

  const trackArray = catalogDB.get('tracks').value().reverse()
  var returnObject = {
    results : trackArray.slice(skip, skip+limit)
  };

  res.send((returnObject));
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

var updateCatalogDatabase = function(){
  const removeKeys = ['streamable', 'downloadable', 'inEarlyAccess'];

  request({
    url: 'https://connect.monstercat.com/v2/catalog/browse?limit=50&skip=' + 0,
    method: 'GET'
  }, function(err, resp, body){
    if(err){
      console.log(err);
    }else{
      var respJson = JSON.parse(body);

      const total = respJson.total;

      var savedTracks = catalogDB.get('tracks').value().length;
      var rest = ((total - savedTracks) % 50);
      if(rest === 0){
        rest = savedTracks;
      }
      console.log(rest);

      var skip = total - rest;

      if(skip >= 0){
          console.log('Skip: ' + skip)

        request({
          url: 'https://connect.monstercat.com/v2/catalog/browse?limit=50&skip=' + skip,
          method: 'GET'
        }, function(err, result, body){
          if(err){
            console.log(err);
          }else{
            var result = JSON.parse(body).results;
            result.reverse();

            for(var i=0; i<result.length; i++){
              var track = result[i];

              for(var k=0; k<removeKeys.length; k++){
                delete track[removeKeys[k]];
              }

              catalogDB.get('tracks')
                .push(track)
                .write();
            }

            setTimeout(function(){
              updateCatalogDatabase();
            }, 100);
          }
        });
      }else{
        setTimeout(function(){
          updateCatalogDatabase();
        }, 5000);
      }
  }
});
}

updateCatalogDatabase();
