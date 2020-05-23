var admin = require("firebase-admin");
var imap = require("imap-simple");
var HTMLParser = require('node-html-parser');

var serviceAccount = require("./config/firebase_config.json");
var mailConfig = require("./config/mail_config.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://player-for-monsterdcat.firebaseio.com"
})

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var oldSubjects = [];

var loop = function(){
  return imap.connect(mailConfig).then(function(connection){
    return connection.openBox('INBOX').then(function () {
      var searchCriteria = [
          'UNSEEN',
         [ 'FROM', 'info@monstercat.com']
      ];

      var fetchOptions = {
          bodies: ['HEADER', 'TEXT'],
          markSeen: true
      };

      return connection.search(searchCriteria, fetchOptions).then(function (results) {
          var bodys = results.map(function(res){
            return res.parts.filter(function(part){
              return part.which === 'TEXT';
            })[0].body;
          });

          var subjects = results.map(function (res) {
              return res.parts.filter(function (part) {
                  return part.which === 'HEADER';
              })[0].body.subject[0];
          });

          if(oldSubjects.length !== subjects.length){
            oldSubjects = subjects;

            var body = (bodys[bodys.length-1]);

            var root = HTMLParser.parse(body);
            console.log(root);

            var message = {
              data: {
               title: 'Monstercat Newsletter',
               msg: subjects[subjects.length-1]
              },
              topic: 'newsletter'
            };

            admin.messaging().send(message)
          .then((response) => {
              // Response is a message ID string.
              console.log('Successfully sent message:', response);
            })
            .catch((error) => {
              console.log('Error sending message:', error);
            });
          }

          connection.end();

          loop();
      });
  });
});
}

 loop();