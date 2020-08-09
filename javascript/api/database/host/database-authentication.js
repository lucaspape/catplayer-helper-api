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

    //privlevels: 0->basic usage
    //            1->downloading
    //            2->admin

    const createSessionTableQuery = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`auth` (`sortId` INT AUTO_INCREMENT PRIMARY KEY, `email` TEXT, `password` TEXT, `privilegeLevel` INT);'

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
              if(result.password === password){
                request({
                  url: 'http://database-session/session',
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
                console.log('DB password: ' + results);
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

          const insertUserQuery = 'INSERT INTO `' + dbName + '`.`auth` (email, password, privilegeLevel) values ("' + email + '","' + password + '","' + privilegeLevel + '");';

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
          const username = req.query.email;
          const userquery = 'SELECT privilegeLevel FROM `' + dbName + '`.`auth` WHERE email="' + username + '";'

          mysqlConnection.query(userquery, (err, result) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.status(200).send({privilegeLevel: result.privilegeLevel})
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
