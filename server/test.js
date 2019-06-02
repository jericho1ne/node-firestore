/**
 *
 * @param {*} collectionRef
 * @param {*} count
 */
function getBulk(collectionRef, count) {
  let queryRef = null;

  // This needs to be a field in each object
  // like object.ts = (new Date()).getTime()
  let sortVal = 'ts';

  queryRef = collectionRef
    .orderBy(sortVal, 'desc')
    // .startAfter(start)
    .limit(count);

  return new Promise((resolve, reject) => {
    return queryRef.get()
      .then((snapshot) => {
        // Populate results to send back
        let queryResults = [];

        snapshot.forEach((doc) => {
          queryResults.push(doc.data());
        })

        resolve(queryResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
}


// https://firebase.google.com/docs/reference/js/firebase.database.Query
function getExact(collectionRef, field, value) {
  let queryRef = null;
  queryRef = collectionRef
    .where(field, '==', value)
    .limit(1);

  return new Promise((resolve, reject) => {
    return queryRef.get()
      .then((snapshot) => {
        // Populate results to send back
        let queryResults = [];
        snapshot.forEach((doc) => {
          queryResults.push(doc.data());
        })
        resolve(queryResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

var admin = require("firebase-admin");
var serviceAccount = require("./calgary-trio-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://calgary-trio.firebaseio.com"
});


let database = admin.firestore();
let collectionName = 'plc-motion-nw';
let plcData = database.collection(collectionName);

database.settings({ timestampsInSnapshots: true });

// READ FROM FIRESTORE
// getBulk(plcData, 5)
//   .then((results) => {
//     console.log(results);
//   })


getExact(plcData, 'revct', 1328028)
  .then((results) => {
    console.log(results);
  })
