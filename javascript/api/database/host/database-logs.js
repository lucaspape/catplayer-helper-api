const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const utils = require('./utils.js');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '';
const dbName = 'monstercatDB';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const mysqlConnection = mysql.createConnection({
  host: 'mariadb',
  user: 'root',
  password: 'JacPV7QZ',
  database: dbName
});

mysqlConnection.connect(err => {
  if (err) {
    console.log(err);
    return err;
  } else {
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
              res.send(err);
            } else {
              res.send({});
            }
          });
        });

        app.get(APIPREFIX + '/log', (req, res) => {
          const url = req.body.url;
          const userAgent = req.body.userAgent;
          const timestamp = Math.floor(new Date() / 1000);

          const insertLogQuery = 'SELECT timestamp,url,userAgent FROM `' + dbName + '`.`log`;'

          mysqlConnection.query(insertLogQuery, (err, result) => {
            if (err) {
              res.send(err);
            } else {
              res.send({
                logs: result
              });
            }
          });
        });
      }
    });
  }
});