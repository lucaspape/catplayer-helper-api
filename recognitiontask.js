const tesseract = require('node-tesseract-ocr');
const request = require('request');
const fs = require('fs');

var recognize = function(){
  var tesseractOptions = {
          l: 'eng',
          psm: 6
  }

  const dateNow = Date.now() / 1000;

  const titleFileName = 'recognition/title_' + dateNow + '.png';
  const artistFileName = 'recognition/artist' + dateNow + '.png';

  download('http://192.168.227.10:4000/api/v1/cover', 'cover.png', function(){
  });

  try{
  download('http://192.168.227.10:4000/api/v1/title', titleFileName, function(){
    download('http://192.168.227.10:4000/api/v1/artist', artistFileName, function(){
    	tesseract.recognize(artistFileName, tesseractOptions)
          .then(artist => {
            var tempArtist = artist.replace('\n\u000c', '');

            tesseract.recognize(titleFileName, tesseractOptions)
              .then(title => {
                var tempTitle = title.replace('\n\u000c', '');

                var returnObject = {
                  artist:tempArtist,
                  title:tempTitle
                }

                fs.writeFileSync('currentdata.json', JSON.stringify(returnObject));


		fs.unlinkSync(titleFileName);
		fs.unlinkSync(artistFileName);
		recognize();
     }).catch((error) => {console.log(error); fs.unlinkSync(titleFileName); fs.unlinkSync(artistFileName); recognize();});
     }).catch((error) => {console.log(error); fs.unlinkSync(titleFileName); fs.unlinkSync(artistFileName); recognize();});
    });
  });

  }catch(err){
    console.log(err);
    fs.unlinkSync(titleFileName);
    fs.unlinkSync(artistFileName);
    recognize();
  }
}

var download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

recognize();
