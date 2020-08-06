const request = require('request');
const args = require('minimist')(process.argv.slice(2));

switch(args.a){
  case 'catalog':
    if(args.json !== undefined){
      addToCatalog(JSON.parse(args.json));
    }else{
        console.log('json not defined');
    }

    break;
  default:
    console.log('unknown command');
}

function addToCatalog(json){
  request({
    url: 'http://proxy-internal/database-update-catalog',
    method: 'POST',
    json: true,
    body: json
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
}
