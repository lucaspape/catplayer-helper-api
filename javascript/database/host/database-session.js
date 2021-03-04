const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const request = require('request');

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const dbName = 'monstercatDB';

const sqlhelper = require('/app/sqlhelper.js');

sqlhelper.getConnection(
  function (mysqlConnection) {
    console.log('Connected to database!');

    const createSessionTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`session` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `cid` TEXT, `gold` TEXT);'

    mysqlConnection.query(createSessionTableQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        app.post(APIPREFIX + '/session', (req, res) => {
          const cid = req.body.cid;
          const cidHash = crypto.createHash('sha256').update(cid).digest('base64');

          const sessionQuery = 'SELECT gold FROM `' + dbName + '`.`session` WHERE cid="' + cidHash + '";'

          mysqlConnection.query(sessionQuery, (err, result) => {
            if (err) {
              res.send(err);
            } else {
              if (result.gold === undefined) {
                getSession(cid,
                  function(json) {
                    const insertSessionQuery = 'INSERT INTO `' + dbName + '`.`session` (cid, gold) values ("' + cidHash + '","' + json.user.hasGold + '");';

                    mysqlConnection.query(insertSessionQuery, (err, result) => {
                      if (err) {
                        res.send(err);
                      } else {
                        res.send({
                          gold: JSON.parse(json.user.hasGold)
                        });
                      }
                    });
                  },
                  function(err) {
                    res.send(err);
                  });
              } else {
                res.send({
                  gold: JSON.parse(result.gold)
                });
              }
            }
          });
        });

        app.listen(PORT, () => {
          console.log('Server started on port ' + PORT);
        });
      }
    });
  }, function (err) {
    console.log(err);
    return err;
  });

function getSession(cid, callback, errorCallback) {
  if (cid !== undefined) {
    request({
      url: 'https://connect.monstercat.com/v2/self/session',
      method: 'GET',
      headers: {
        'Cookie': 'cid=' + cid
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