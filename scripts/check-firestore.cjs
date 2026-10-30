const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.resolve(__dirname, '../../ace-web/firebase-admin-key.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  const docRef = db.doc('system/app_config');
  const snap = await docRef.get();
  if (snap.exists) {
    console.log("Firestore app_config contents:", snap.data());
  } else {
    console.log("Document system/app_config does not exist!");
  }
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
