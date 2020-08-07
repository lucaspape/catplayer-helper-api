const request = require('request');
const mm = require('music-metadata');
const { v4: uuidv4 } = require('uuid');
const args = require('minimist')(process.argv.slice(2));

switch(args.a){
  case 'catalog':
    if(args.i !== undefined){
      mm.parseFile(args.i)
        .then( metadata => {
            addSong(metadata);
        })
        .catch( err => {
          console.error(err.message);
        });
    }else{
        console.log('input file not specified');
    }

    break;
  default:
    console.log('unknown command');
}

function addSong(metadata){
  const id = uuidv4();

  const artists = [];

  const artistRequestPromiseArray = [];

  for(var i=0; metadata.common.artists.length<i; i++){
    artists[i] = {
      id: uuidv4(),
      about: '',
      bookingDetails: '',
      imagePositionX: 0,
      imagePositionY: 0,
      links: [],
      managementDetails: '',
      name: metadata.common.artists[i],
      uri: '',
      years: [],
    };

    artistRequestPromiseArray.push(new Promise((resolve, reject) => {
      request({
        url: 'http://database-update-artists/artists',
        method: 'POST',
        json: true,
        body: artists[i]
      }, function(err, resp, body) {
        if (err) {
          console.log(err);
        } else {
          try {
            console.log(body);
          } catch (e) {
            console.log(e);
          }
        }
      });
    }));
  }

  Promise.all(artistRequestPromiseArray).then(function(){
    var genrePrimary = metadata.common.genre[0];
    var genreSecondary = metadata.common.genre[1];
    var isrc = metadata.common.isrc[0];

    if(!genrePrimary){
      genrePrimary = '';
    }

    if(!genreSecondary){
      genreSecondary = '';
    }

    if(!isrc){
      isrc = '';
    }

    const releasePostObject = {
      id: uuidv4(),
      catalogId: uuidv4(),
      artistsTitle: metadata.common.artist,
      genrePrimary: genrePrimary,
      genreSecondary: genreSecondary,
      links: [],
      releaseDate: '',
      title: metadata.common.album,
      type: '',
      version: ''
    };

    const catalogPostObject = {
      id: id,
      artists: artists,
      artistsTitle: metadata.common.artist,
      bpm: 0,
      creatorFriendly: true,
      debutDate: '',
      duration: metadata.format.duration,
      explicit: false,
      genrePrimary: genrePrimary,
      genreSecondary: genreSecondary,
      isrc: isrc,
      playlistSort: 0,
      release: releasePostObject,
      tags: [],
      title: metadata.common.title,
      trackNumber: 0,
      version: '',
      inEarlyAccess: false,
    };

    request({
      url: 'http://database-update-releases/release',
      method: 'POST',
      json: true,
      body: releasePostObject
    }, function(err, resp, body) {
      if (err) {
        console.log(err);
      } else {
        try {
          console.log(body);

          request({
            url: 'http://database-update-catalog/catalog',
            method: 'POST',
            json: true,
            body: catalogPostObject
          }, function(err, resp, body) {
            if (err) {
              console.log(err);
            } else {
              try {
                console.log(body);
              } catch (e) {
                console.log(e);
              }
            }
          });
        } catch (e) {
          console.log(e);
        }
      }
    });
  });
}
