/**
 * update-firestore-config.cjs
 * One-shot script to update system/app_config in Firestore
 * with the v3.0.5 release metadata.
 */
const admin = require("firebase-admin");

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "ace-school-d725d";

admin.initializeApp({ projectId: PROJECT_ID });

const db = admin.firestore();

async function updateConfig() {
  const docRef = db.collection("system").doc("app_config");

  const payload = {
    latestVersion: "3.0.5",
    apkDownloadUrl: "https://ace-mobile.vercel.app/apk/ace-mobile-v3.0.5.apk",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(payload, { merge: true });

  console.log("═══════════════════════════════════════════════════════");
  console.log("  ✅  FIRESTORE CLOUD SYNC COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  📦 latestVersion    → ${payload.latestVersion}`);
  console.log(`  🔗 apkDownloadUrl   → ${payload.apkDownloadUrl}`);
  console.log(`  📍 Document Path    → system/app_config`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("  🚀 Cloud assets are LIVE and ready for testing.");
  console.log("═══════════════════════════════════════════════════════");
}

updateConfig()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Firestore update failed:", err);
    process.exit(1);
  });
