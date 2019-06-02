// Install PM2 in order to run as Daemon!
// 1) npm install pm2 -g
// 2) create shortcut by right clicking on `node-startup.bat`
// 3) Go to Windows > Start > Run (or Windows + R key), type in `shell:startup`
// 4) Copy / Paste the shorcut you've just created in the Startup folder
// https://www.npmjs.com/package/pm2

// Required packages
const got = require('got');
const uuidv4 = require('uuid/v4');
const admin = require("firebase-admin");
const cron = require('node-cron');

// DB name we will be pushing data to
const COLLECTION_NAME = 'plc-motion-nw';

function pushToFirebase(docRef, plcData) {
  console.log(plcData);

  return new Promise((resolve, reject) => {
    return docRef.set(plcData)
      .then((result) => {
        console.log(result);
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
    }); // End db insert
}

// https://www.npmjs.com/package/html-parse-stringify
const htmlParser = require('html-parse-stringify');

// Firebase creds
const serviceAccount = require("./calgary-trio-firebase.json");

// FIREBASE INIT
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://calgary-trio.firebaseio.com"
});

let database = admin.firestore();
database.settings({ timestampsInSnapshots: true });

// Set up database reference
let collectionRef = database.collection(COLLECTION_NAME);

const formData =  '<body><version>1.2</version><client>hmi.js</client><client_ver>1.6.30.145.04b</client_ver><file_name>vRhz1</file_name><action>Read</action><item_list_size>8</item_list_size><item_list><i><n>@GV.rSetpoint</n></i><i><n>@GV.vIstPos_Glocke</n></i><i><n>@GV.vstrMotorImpuls</n></i><i><n>@GV.vxErrorBlinker</n></i><i><n>@GV.vxParaloaded</n></i><i><n>Alarming.vErrorlist[1]</n></i><i><n>Main.diRevPointCount</n></i><i><n>Main.diZSpurCount</n></i></item_list></body>';

// Prepare POST data
var options = {
  headers: {
    'Host': '192.168.101.2',
    'Content-Type': 'text/html',
    'Connection': 'keep-alive',
    'Accept': 'text/plain, */*; q=0.01',
  },
  body: JSON.stringify(formData)
};


cron.schedule('*/10 * * * * *', () => {
  let timestamp = Math.floor(new Date() / 1000);

  console.log('Uploading to Firebase: ' + timestamp);


got.post('http://192.168.101.2:80/cgi-bin/ILRReadValues.exe', options)
  .then((resp) => {
    //console.log(resp.body);

    const docRoot = htmlParser.parse(resp.body);
    const items = docRoot[0].children[6];

    /* DEBUG */
    // @GV.rSetpoint
    // console.log(items.children[0].children[0].children[0].content);
    // @vIstPosGlocke
    // console.log(items.children[1].children[1].children[0].content);

    // const rSetpoint = parseInt(items.children[0].children[1].children[0].content);
    // const vstrMotorImpuls = parseInt(items.children[2].children[1].children[0].content);
    // const vxParaloaded = parseInt(items.children[4].children[1].children[0].content);

    // vIstPos_Glocke means "Bell Jar Position"
    const vIstPos_Glocke = parseFloat(items.children[1].children[1].children[0].content);

    const vxErrorBlinker = parseInt(items.children[3].children[1].children[0].content);
    const diRevPointCount = parseInt(items.children[6].children[1].children[0].content);

    // Build inividual plc data object
    let plcData = {
      ts: timestamp,
      //rSetpoint: rSetpoint,
      //vstrMotorImpuls: vstrMotorImpuls,
      // vxParaloaded: vxParaloaded,
      angle: vIstPos_Glocke,
      err: vxErrorBlinker,
      revct: diRevPointCount,
    };

    // Create unique document id each time
    let docRef = collectionRef.doc(uuidv4());

    // Insert into DB
    pushToFirebase(docRef, plcData);
  }); // End got POST
}); // End got POST
