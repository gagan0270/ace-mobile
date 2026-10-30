/**
 * update-firestore-config.mjs
 * One-shot script using client Firebase SDK to update system/app_config
 * with v3.0.5 release metadata. No service account required.
 */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env manually (no hardcoded keys) ───────────────────────────────────
function loadEnv(envPath) {
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv(resolve(__dirname, "../.env"));

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateConfig() {
  const docRef = doc(db, "system", "app_config");

  const payload = {
    latestVersion: "3.0.5",
    apkDownloadUrl: "https://ace-mobile.vercel.app/apk/ace-mobile-v3.0.5.apk",
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });

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
