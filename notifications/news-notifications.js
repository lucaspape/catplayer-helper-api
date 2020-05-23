var admin = require("firebase-admin");

var serviceAccount = require("./firebase/config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://player-for-monsterdcat.firebaseio.com"
});

var message = {
  data: {
   title: 'mctv',
   msg: 'This week on mctv... Monstercat Instinct takes over with Duumu, SMLE, and CloudNone on Thurs May 28th. Tune in for dj sets and Q&As!',
   url: 'https://live.monstercat.com/'
  },
  topic: 'default'
};

admin.messaging().send(message)
.then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
