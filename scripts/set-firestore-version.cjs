const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.resolve(__dirname, '../../ace-web/firebase-admin-key.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const version = process.argv[2] || '2.0.8';

async function setVersion() {
  const docRef = db.doc('system/app_config');
  await docRef.set({
    latestVersion: version,
    apkDownloadUrl: `https://ace-mobile.vercel.app/apk/ace-mobile-v${version}.apk`
  }, { merge: true });
  console.log(`Successfully updated Firestore latestVersion to: ${version}`);
  process.exit(0);
}

setVersion().catch(err => {
  console.error(err);
  process.exit(1);
});
