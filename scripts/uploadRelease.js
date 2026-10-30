#!/usr/bin/env node
/**
 * scripts/uploadRelease.js
 *
 * ACE Mobile — OTA Release Publisher
 * ───────────────────────────────────────────────────────────────────────────
 * Usage:  node scripts/uploadRelease.js
 *
 * What this does, in order:
 *   1. Reads the version from package.json   → becomes the new latestVersion
 *   2. Finds the release APK at:
 *        android/app/build/outputs/apk/release/app-release.apk
 *   3. Uploads the APK to Firebase Storage at:
 *        releases/ace-mobile-v{version}.apk
 *   4. Makes the file publicly readable via a download token URL
 *   5. Writes { latestVersion, apkDownloadUrl } to Firestore system/app_config
 *   6. Prints a ✅ success summary with the version and public URL
 *
 * Prerequisites:
 *   - Build the release APK first with Android Studio or:
 *       cd android && ./gradlew assembleRelease
 *   - Firebase credentials are read from the .env file in the project root.
 *   - The service account key must be at: ../../ace-web/firebase-admin-key.json
 *     (adjust KEY_PATH below if your layout is different)
 *
 * Dependencies (already in package.json):
 *   firebase-admin, dotenv (or read raw .env manually)
 * ───────────────────────────────────────────────────────────────────────────
 */

import { createRequire } from "module";
import { readFileSync, existsSync, createReadStream } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
function loadEnv(envPath) {
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }
  return env;
}

const ENV_PATH = resolve(__dirname, "../.env");
const env = loadEnv(ENV_PATH);

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT = resolve(__dirname, "..");
const PKG_PATH = join(ROOT, "package.json");

// Service account key — shared with ace-web project
const KEY_PATH = resolve(__dirname, "../../ace-web/firebase-admin-key.json");

// Release APK output paths
const APK_PATH_SIGNED = join(ROOT, "android/app/build/outputs/apk/release/app-release.apk");
const APK_PATH_UNSIGNED = join(ROOT, "android/app/build/outputs/apk/release/app-release-unsigned.apk");

// Firebase Storage destination folder
const STORAGE_FOLDER = "releases";

// Firestore document to update
const FIRESTORE_DOC = "system/app_config";

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀  ACE Mobile — OTA Release Publisher\n" + "─".repeat(50));

  // 1. Read version from package.json
  if (!existsSync(PKG_PATH)) {
    console.error("❌  Could not find package.json at:", PKG_PATH);
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
  const version = pkg.version;
  if (!version) {
    console.error("❌  package.json does not contain a version field.");
    process.exit(1);
  }
  console.log(`📦  Version detected: ${version}`);

  // 2. Verify APK exists
  let apkPath = APK_PATH_SIGNED;
  if (!existsSync(apkPath)) {
    apkPath = APK_PATH_UNSIGNED;
  }

  if (!existsSync(apkPath)) {
    console.error(`❌  Release APK not found at either:\n    ${APK_PATH_SIGNED}\n    ${APK_PATH_UNSIGNED}`);
    console.error(
      "\n    Build it first with:\n      cd android && ./gradlew assembleRelease"
    );
    process.exit(1);
  }
  const apkStat = (await import("fs")).statSync(apkPath);
  const apkSizeMb = (apkStat.size / 1024 / 1024).toFixed(2);
  console.log(`📱  APK found: ${apkPath}\n    Size: ${apkSizeMb} MB`);

  // 3. Initialize Firebase Admin
  if (!existsSync(KEY_PATH)) {
    console.error(`❌  Service account key not found at:\n    ${KEY_PATH}`);
    console.error(
      "\n    Download your Firebase service account key from:\n" +
      "    Firebase Console → Project Settings → Service Accounts → Generate new private key\n" +
      "    Then save it at the path above."
    );
    process.exit(1);
  }

  const admin = require("firebase-admin");
  const serviceAccount = require(KEY_PATH);

  // Avoid double-init if the script is re-run in a persistent process
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET && !env.VITE_FIREBASE_STORAGE_BUCKET.includes("firebasestorage.app")
        ? env.VITE_FIREBASE_STORAGE_BUCKET
        : `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }

  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // 4. Upload APK to Firebase Storage or Fallback to Vercel
  const storageFileName = `ace-mobile-v${version}.apk`;
  const storageDest = `${STORAGE_FOLDER}/${storageFileName}`;
  let downloadUrl;
  let uploadMethod = "Firebase Storage";

  try {
    console.log(`\n📤  Uploading to Firebase Storage…\n    gs://${bucket.name}/${storageDest}`);

    const [file] = await bucket.upload(apkPath, {
      destination: storageDest,
      metadata: {
        contentType: "application/vnd.android.package-archive",
        cacheControl: "public, max-age=31536000",
      },
    });

    console.log("    ✅  Upload complete.");

    try {
      await file.makePublic();
      downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storageDest}`;
      console.log("🔓  File made publicly accessible.");
    } catch {
      console.warn("⚠️   makePublic() not allowed — generating long-lived signed URL instead.");
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: "12-31-2099",
      });
      downloadUrl = signedUrl;
    }
  } catch (err) {
    console.warn(`⚠️  Firebase Storage upload failed: ${err.message || err}`);
    console.log("🚀  Falling back to Vercel production hosting…");
    uploadMethod = "Vercel Hosting";

    // Ensure public/apk directory exists
    const publicApkDir = join(ROOT, "public/apk");
    const { mkdirSync, copyFileSync } = await import("fs");
    if (!existsSync(publicApkDir)) {
      mkdirSync(publicApkDir, { recursive: true });
    }

    // Copy the APK
    const targetApkPath = join(publicApkDir, storageFileName);
    copyFileSync(apkPath, targetApkPath);
    console.log(`    Copied APK to: ${targetApkPath}`);

    // Trigger Vercel deploy
    const { execSync } = await import("child_process");
    console.log("    Deploying project to Vercel production...");
    execSync("vercel --prod --yes", { stdio: "inherit", cwd: ROOT });

    // Construct Vercel download URL
    downloadUrl = `https://ace-mobile.vercel.app/apk/${storageFileName}`;
  }

  console.log(`🔗  Download URL:\n    ${downloadUrl}`);

  // 6. Update Firestore system/app_config
  const docRef = db.doc(FIRESTORE_DOC);
  await docRef.set(
    {
      latestVersion: version,
      apkDownloadUrl: downloadUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 7. Done ✅
  console.log(`\n✅  Firestore ${FIRESTORE_DOC} updated successfully.`);
  console.log("\n" + "─".repeat(50));
  console.log(`🎉  RELEASE PUBLISHED!`);
  console.log(`    Version  : v${version}`);
  console.log(`    APK URL  : ${downloadUrl}`);
  console.log(`    Firestore: ${FIRESTORE_DOC}`);
  console.log("─".repeat(50) + "\n");
  console.log(
    "📣  Next steps:\n" +
    "    1. Bump CURRENT_APP_VERSION in App.jsx if not already done.\n" +
    "    2. Build & install the new APK on test devices.\n" +
    "    3. Devices running older versions will see the update modal on next launch.\n"
  );
}

main().catch((err) => {
  console.error("\n❌  Upload failed:", err.message || err);
  process.exit(1);
});
