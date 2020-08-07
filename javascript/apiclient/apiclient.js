const request = require('request');
const mm = require('music-metadata');
const { v4: uuidv4 } = require('uuid');
const args = require('minimist')(process.argv.slice(2));
const sharp = require('sharp');
const fs = require('fs');
const { exec } = require("child_process");

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

  var todoArtists = metadata.common.artists.length;
  var artistsDone = 0;

  function addArtists(){
    if(artistsDone < todoArtists){
      artists[artistsDone] = {
        id: uuidv4(),
        about: '',
        bookingDetails: '',
        imagePositionX: 0,
        imagePositionY: 0,
        links: [],
        managementDetails: '',
        name: metadata.common.artists[artistsDone],
        uri: '',
        years: [],
      };

        request({
          url: 'http://database-update-artists/artists',
          method: 'POST',
          json: true,
          body: artists[artistsDone]
        }, function(err, resp, body) {
          if (err) {
            console.log(err);
          } else {
            try {
              console.log(body);

              artistsDone++;

              addArtists();
            } catch (e) {
              console.log(e);
            }
          }
        });
    }else{
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
        releaseDate: '2020-08-07T00:00:00.000Z',
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
        debutDate: '2020-08-07T00:00:00.000Z',
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

                  //cover image
                  const releaseDir = __dirname + '/../static/release/' + releasePostObject.id;

                  if (!fs.existsSync(releaseDir)) {
                    fs.mkdirSync(releaseDir);
                  }

                  const coverImageBuffer = Buffer.from(metadata.common.picture[0].data.toString('base64'), 'base64');

                  sharp(coverImageBuffer)
                    .resize(2048, 2048)
                    .toFile(releaseDir + '/cover_2048.webp', (err,info)=>{
                      if(err){
                        console.log(err);
                      }else{
                        sharp(coverImageBuffer)
                          .resize(2048, 2048)
                          .toFile(releaseDir + '/cover_2048.jpg', (err,info)=>{
                            if(err){
                              console.log(err);
                            }else{
                              console.log('OK');

                              const trackStreamLocation = __dirname + '/../static-private/release/' + releasePostObject.id + '/track-stream';
                              if (!fs.existsSync(trackStreamLocation)) {
                                fs.mkdirSync(trackStreamLocation);
                              }

                              const trackStreamFileLocation = trackStreamLocation + '/' + id;

                              convert(args.i, trackStreamFileLocation, 'mp3', function(){
                                console.log('OK');

                                const privateReleaseLocation = __dirname + '/../static-private/release/' + releasePostObject.id;
                                if (!fs.existsSync(privateReleaseLocation)) {
                                  fs.mkdirSync(privateReleaseLocation);
                                }


                                const trackDownloadLocation = privateReleaseLocation + '/track-download';
                                if (!fs.existsSync(trackDownloadLocation)) {
                                  fs.mkdirSync(trackDownloadLocation);
                                }

                                const trackDownloadMP3FileLocation = trackDownloadLocation + '/' + id + '.mp3';
                                const trackDownloadFLACFileLocation = trackDownloadLocation + '/' + id + '.flac';
                                const trackDownloadWAVFileLocation = trackDownloadLocation + '/' + id + '.wav';

                                convert(args.i, trackDownloadMP3FileLocation, 'mp3', function(){
                                  console.log('OK');
                                  convert(args.i, trackDownloadFLACFileLocation, 'flac', function(){
                                    console.log('OK');
                                    convert(args.i, trackDownloadWAVFileLocation, 'wav', function(){
                                      console.log('OK');

                                      console.log('All done!');
                                    });
                                  });
                                });
                              });
                            }
                          });
                      }
                    });
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
    }
  }

  addArtists();
}

function convert(input, output, format, callback){
  exec('ffmpeg -i ' + input + ' -f ' + format +  ' ' + output, (err, out, stderr) => {
    if(stderr){
      console.log(stderr);
    }else{
      callback();
    }
  });
}
