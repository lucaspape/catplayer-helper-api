const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = 80
const APIPREFIX = '/api/v1'

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get(APIPREFIX + '/title', (req, res) => {
  res.sendFile(__dirname + 'screenshots/title.png');
});

app.get(APIPREFIX + '/artist', (req, res) => {
  res.sendFile(__dirname + 'screenshots/artist.png');
});

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});