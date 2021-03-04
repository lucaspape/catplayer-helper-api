const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { fork } = require('child_process');
const utils = require('/app/utils.js');
const sqlhelper = require('/app/sqlhelper.js');

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

sqlhelper.getConnection(()=>{
  console.log('Connected to database!');

  app.get(APIPREFIX + '/catalog/search', (req, res) => {
    var gold = false;

    if (req.query.gold !== undefined) {
      gold = JSON.parse(req.query.gold);
    }

    utils.fixSkipAndLimit(req.query, function(skip, limit) {
      const searchString = utils.fixSearchString(req.query.term);

      const terms = searchString.split(' ');

      const catalogSearchQuery = 'SELECT id,artists,artistsTitle,bpm ,creatorFriendly,debutDate,debutTime,duration,explicit,genrePrimary,genreSecondary,isrc,playlistSort,releaseId,tags,title,trackNumber,version,inEarlyAccess,search FROM `' + sqlhelper.dbName + '`.`catalog` WHERE search LIKE "%' + terms[0] + '%" ORDER BY debutDate DESC ' + ';';

      mysqlConnection.query(catalogSearchQuery, (err, result) => {
        if (err) {
          res.send(err);
        } else {
          const process = fork('/app/api/processors/catalog-processor.js');
          process.send({
            searchString: searchString,
            terms: terms,
            trackArray: result,
            skip: skip,
            limit: limit,
            gold: gold
          });

          process.on('message', (processResult) => {
            if(processResult.err === undefined){
              res.send(processResult);
            }else{
              res.err(processResult.err);
            }
          });
        }
      });
    });
  });

  app.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
  });
},
(err)=>{
  return err;
});
