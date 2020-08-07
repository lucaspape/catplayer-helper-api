const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const request = require('request');
const cookieParser = require('cookie-parser');

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

const dbName = 'monstercatDB';

const sqlhelper = require('/app/api/sqlhelper.js');

sqlhelper.getConnection(
  function (mysqlConnection) {
    console.log('Connected to database!');

    const createSessionTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`session` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `sid` TEXT, `gold` TEXT);'

    mysqlConnection.query(createSessionTableQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        app.post(APIPREFIX + '/login', (req, res) => {
          res.status(200).send('{"sid": "testsid"}');
        });

        app.post(APIPREFIX + '/register', (req, res) => {
          res.status(200).send('OK');
        });

        app.get(APIPREFIX + '/session', (req, res) => {
          if(req.cookies['connect.sid'] === 'testsid'){
            res.status(200).send({basicAuthentication: true});
          }else{
            res.status(200).send({basicAuthentication: false});
          }
        });

        app.post(APIPREFIX + '/session', (req, res) => {
          const sid = req.body.sid;
          const sidHash = crypto.createHash('sha256').update(sid).digest('base64');

          const sessionQuery = 'SELECT gold FROM `' + dbName + '`.`session` WHERE sid="' + sidHash + '";'

          mysqlConnection.query(sessionQuery, (err, result) => {
            if (err) {
              res.send(err);
            } else {
              if (result.gold === undefined) {
                const insertSessionQuery = 'INSERT INTO `' + dbName + '`.`session` (sid, gold) values ("' + sidHash + '","' + json.user.hasGold + '");';

                mysqlConnection.query(insertSessionQuery, (err, result) => {
                  if (err) {
                    res.send(err);
                  } else {
                    res.send({
                      gold: JSON.parse(json.user.hasGold)
                    });
                  }
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
