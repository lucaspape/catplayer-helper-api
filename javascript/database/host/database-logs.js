const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = 80;
const APIPREFIX = '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const dbName = 'monstercatDB';

const sqlhelper = require('./sqlhelper.js');

sqlhelper.getConnection(
  function (mysqlConnection) {
    console.log('Connected to database');

    const createLogTable = 'CREATE TABLE IF NOT EXISTS `' + dbName + '`.`log` (`id` INT AUTO_INCREMENT PRIMARY KEY, `timestamp` TEXT, `url` TEXT, `userAgent` TEXT);'

    mysqlConnection.query(createLogTable, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Created table/exists!');

        app.post(APIPREFIX + '/log', (req, res) => {
          const url = req.body.url;
          const userAgent = req.body.userAgent;
          const timestamp = Math.floor(new Date() / 1000);

          const insertLogQuery = 'INSERT INTO `' + dbName + '`.`log` (timestamp, url, userAgent) values ("' + timestamp + '","' + url + '", "' + userAgent + '");'

          mysqlConnection.query(insertLogQuery, (err, result) => {
            if (err) {
              console.log(err);
              res.send(err);
            } else {
              res.send({});
            }
          });
        });

        app.get(APIPREFIX + '/log', (req, res) => {

          const getLogQuery = 'SELECT timestamp,url FROM `' + dbName + '`.`log` ORDER BY id DESC LIMIT 50;'

          mysqlConnection.query(getLogQuery, (err, result) => {
            if (err) {
              res.send(err);
            } else {
              res.send({
                logs: result
              });
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
