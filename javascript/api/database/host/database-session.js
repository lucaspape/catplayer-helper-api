const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const request = require('request');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

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

    const createSessionTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`session` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `email` TEXT, `sid` TEXT UNIQUE KEY, `expires` INT);'

    mysqlConnection.query(createSessionTableQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        app.get(APIPREFIX + '/session', (req, res) => {
          console.log('New session key request!');
          const email = req.query.email;
          const sid = uuidv4();
          const sidHash = crypto.createHash('sha256').update(sid).digest('base64');
          const expires = 0;

          const insertSessionQuery = 'INSERT INTO `' + dbName + '`.`session` (email, sid, expires) values ("' + email + '","' + sidHash + '","' + expires + '");';

          mysqlConnection.query(insertSessionQuery, (err, result) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.status(200).send({sid:sid});
            }
          });
        });

        app.post(APIPREFIX + '/session', (req, res) => {
          const sid = req.body.sid;
          const sidHash = crypto.createHash('sha256').update(sid).digest('base64');

          const sessionQuery = 'SELECT email,expires FROM `' + dbName + '`.`session` WHERE sid="' + sidHash + '";'

          mysqlConnection.query(sessionQuery, (err, result) => {
            if (err) {
              res.status(500).send(err);
            } else {
              console.log(JSON.stringify(result));
              if(result[0].email){
                request({
                  url: 'http://database-authentication/privlevel?username=' + result[0].email,
                  method: 'GET',
                }, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    console.log('auth level for user ' + result[0].email + ' : ' + body.privilegeLevel);

                    switch(body.privilegeLevel){
                      case 0:
                        res.status(200).send({basicAuthentication: true, downloadAllowed: false, adminActions: false});
                        break;
                      case 1:
                        res.status(200).send({basicAuthentication: true, downloadAllowed: true, adminActions: false});
                        break;
                      case 2:
                        res.status(200).send({basicAuthentication: true, downloadAllowed: true, adminActions: true});
                        break;
                      default:
                        res.status(401).send('Could not find user');
                    }
                  } else {
                    console.log('Privlevel request failed');
                    res.status(500).send(error);
                  }
                });
              }else{
                console.log('Could not find user');
                res.status(401).send('Could not find user');
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
