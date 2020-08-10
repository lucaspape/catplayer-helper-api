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

    //privlevels: 0->basic usage
    //            1->downloading
    //            2->admin

    const createSessionTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`auth` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `email` TEXT UNIQUE KEY, `password` TEXT, `privilegeLevel` INT, `userId` TEXT UNIQUE KEY);'

    mysqlConnection.query(createSessionTableQuery, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        app.post(APIPREFIX + '/login', (req, res) => {
          console.log('Login!');

          const email = req.body.email;
          console.log('Password before hash: ' + req.body.password);
          const password = crypto.createHash('sha256').update(req.body.password).digest('base64');

          const loginQuery = 'SELECT password FROM `' + dbName + '`.`auth` WHERE email="' + email + '";'

          console.log(loginQuery);

          mysqlConnection.query(loginQuery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
            } else {
              if(result[0].password === password){
                request({
                  url: 'http://database-session/session?email=' + email,
                  method: 'GET',
                }, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    console.log('Session request success!');
                    res.status(200).send(body);
                  } else {
                    console.log('Session request failed!');
                    res.status(500).send(error);
                  }
                });
              }else{
                console.log('DB password: ' + JSON.stringify(result));
                console.log('Received password: ' + password)
                console.log('Wrong password!');
                res.status(401).send('Wrong password');
              }
            }
          });
        });

        app.post(APIPREFIX + '/register', (req, res) => {
          console.log('register');

          const email = req.body.email;
          const password = crypto.createHash('sha256').update(req.body.password).digest('base64');
          const privilegeLevel = req.body.privilegeLevel;
          const userId = uuidv4();

          const insertUserQuery = 'INSERT INTO `' + dbName + '`.`auth` (email, password, privilegeLevel, userId) values ("' + email + '","' + password + '","' + privilegeLevel + '","' + userId + '");';

          console.log(insertUserQuery);

          mysqlConnection.query(insertUserQuery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
            } else {
              console.log('OK');
              res.status(200).send('OK');
            }
          });
        });

        app.get(APIPREFIX + '/privlevel', (req, res) => {
          console.log('Privlevel request');
          const email = req.query.email;
          const userquery = 'SELECT privilegeLevel FROM `' + dbName + '`.`auth` WHERE email="' + email + '";'

          mysqlConnection.query(userquery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
            } else {
              console.log(JSON.stringify(result));
              res.status(200).send({privilegeLevel: result[0].privilegeLevel})
            }
          });
        });

        app.get(APIPREFIX + '/user', (req, res) => {
          console.log('User request');
          const email = req.query.email;
          const userquery = 'SELECT userId,privilegeLevel FROM `' + dbName + '`.`auth` WHERE email="' + email + '";'

          mysqlConnection.query(userquery, (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
            } else {
              console.log(JSON.stringify(result));
              res.status(200).send(result[0]);
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
