const http = require('http');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const {getMessaging} = require('firebase-admin/messaging');
const {getAuth} = require('firebase-admin/auth');
initializeApp({
  credential: applicationDefault()
});

const port = 8080;

const db = getFirestore();

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Eshy ist ein meerschwine</h1>');
});

server.listen(port, "0.0.0.0", () => {
  getAuth()
    .listUsers(100, )
    .then((listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
          db.collection("users").doc(userRecord.toJSON().uid).update({displayEmail: false}).then((val)=>{}).catch((e) => {
            console.log(e)
          });
      });
    })
    .catch((error) => {
      console.log('Error listing users:', error);
    });
  console.log("Listening");
  var chatObserver = db.collection("chats").onSnapshot((querySnapshot) => {
    querySnapshot.docChanges().forEach(async (change) => {
      if (change.type === "modified") {
        var messageData = (await change.doc.ref.collection("Messages").orderBy("number", "desc").limit(1).get()).docs[0];
        var otherId = messageData.data().user;
        var otherData = await db.collection("users").doc(otherId).get();
        var meId = "";
        if (otherId == change.doc.data().users[1]) {
          meId = change.doc.data().users[0];
        }
        else {
          meId = change.doc.data().users[1];
        }
        var meData = await db.collection("users").doc(meId).get();
        sendMessages(meData.data().deviceTokens, {
            title: otherData.data().name + " sent a message:",
            body: messageData.data().text
          },
          {
            type: "chat",
              sender: otherId,
              chatId: change.doc.data().id,
              senderName: otherData.data().name
          }
        );
        console.log(otherData.data().name + " sent a message: " + messageData.data().text)
      }
    });
  });
});
function sendMessages(tokens, notification, data) {
  const message = {
  data: data,
  notification: notification,
  tokens: tokens
};
console.log(message)

// Send a message to the device corresponding to the provided
// registration token.
getMessaging().sendMulticast(message)
  .then((response) => {
    // Response is a message ID string.
    console.log(response.successCount + ' messages were sent successfully', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error.code);
  });

}
