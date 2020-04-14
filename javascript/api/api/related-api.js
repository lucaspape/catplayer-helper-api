const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = 80;
const HOSTNAME = 'http://127.0.0.1:' + PORT;
const APIPREFIX = '/related';
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
    app.post(APIPREFIX + '/', (req, res) => {});


    app.listen(PORT, () => {
      console.log('Server started on port ' + PORT);
    });
  }
});