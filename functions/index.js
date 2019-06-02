const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  return admin.database().ref('/messages').push({original: original}).then((snapshot) => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    return res.redirect(303, snapshot.ref.toString());
  });
});


// Delete records older than 2 hrs.
// https://stackoverflow.com/questions/32004582/delete-firebase-data-older-than-2-hours
// And code example lives here:
// https://github.com/firebase/functions-samples/blob/master/delete-old-child-nodes/functions/index.js
exports.deleteOldItems = functions.database.ref('/path/to/items/{pushId}')
  .onWrite((change, context) => {
    var ref = change.after.ref.parent; // reference to the items
    var now = Date.now();

    // Anything older than 72 hours
    var cutoff = now - 72 * 60 * 60 * 1000;
    var oldItemsQuery = ref.orderByChild('ts').endAt(cutoff);

    return oldItemsQuery.once('value', function(snapshot) {
      // create a map with all children that need to be removed
      var updates = {};
      snapshot.forEach(function(child) {
        updates[child.key] = null
      });
      // execute all updates in one go and return the result to end the function
      return ref.update(updates);
    });
  });
