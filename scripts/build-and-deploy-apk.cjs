const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Resolve Firebase Admin credentials from the web repository
const keyPath = path.resolve(__dirname, '../../ace-web/firebase-admin-key.json');
if (!fs.existsSync(keyPath)) {
  console.error("Error: Could not locate firebase-admin-key.json at " + keyPath);
  process.exit(1);
}

const serviceAccount = require(keyPath);

// 2. Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
  console.log("🚀 Starting Mobile DevOps Auto-Compilation and Deployment Script...");

  // A. Determine next version number from package.json
  console.log("🔄 Reading active local version configurations...");
  const pkg = require(path.resolve(__dirname, '../package.json'));
  const nextVersion = pkg.version || '3.0.9';
  const docRef = db.doc('system/app_config');
  console.log(`📈 Targeted deployment version: ${nextVersion}`);

  // B. Run global production export routines (npm run build)
  console.log("📦 Compiling and optimizing web production assets...");
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

  // Clean up recursive APK assets inside dist to prevent native package bloat
  const distApkPath = path.resolve(__dirname, '../dist/apk');
  if (fs.existsSync(distApkPath)) {
    console.log("🧹 Cleaning up recursive APK folder inside dist before sync...");
    fs.rmSync(distApkPath, { recursive: true, force: true });
  }

  // C. Sync Capacitor assets to native Android project
  console.log("🔄 Syncing web assets to Capacitor native project container...");
  execSync('npx cap sync', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

  // D. Compile native Android debug APK using Gradle wrapper
  console.log("🛠️ Compiling native Android debug APK using Gradle wrapper...");
  const env = {
    ...process.env,
    JAVA_HOME: "C:\\Users\\gagan\\AppData\\Local\\Google\\AndroidStudio2025.2.2\\tmp\\patch-update\\jre",
    ANDROID_HOME: "C:\\Users\\gagan\\AppData\\Local\\Android\\Sdk"
  };
  
  execSync('cmd.exe /c "cd android && gradlew.bat assembleDebug"', { 
    stdio: 'inherit', 
    cwd: path.resolve(__dirname, '..'),
    env: env
  });

  const debugApkPath = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
  if (!fs.existsSync(debugApkPath)) {
    console.error("❌ Gradle compilation succeeded but compiled APK was not found at: " + debugApkPath);
    process.exit(1);
  }

  // E. Assemble release APK into public/apk for Vercel CDN distribution
  console.log("📦 Packaging binary APK assets into Vercel assets folder...");
  const publicApkDir = path.resolve(__dirname, '../public/apk');
  if (!fs.existsSync(publicApkDir)) {
    fs.mkdirSync(publicApkDir, { recursive: true });
  }
  
  const apkFileName = `ace-mobile-v${nextVersion}.apk`;
  const apkPath = path.join(publicApkDir, apkFileName);
  
  fs.copyFileSync(debugApkPath, apkPath);
  console.log(`✅ App package copied successfully to: ${apkPath}`);

  // F. Define Vercel CDN public URL
  const publicUrl = `https://ace-mobile.vercel.app/apk/${apkFileName}`;
  console.log(`🔗 Vercel Host Target URL: ${publicUrl}`);

  // G. Automated Cloud Storage Handshake: try upload, fallback to Vercel
  try {
    const bucketName = 'ace-school-d725d.appspot.com';
    const storageBucket = admin.storage().bucket(bucketName);
    console.log(`📤 Attempting Firebase Cloud Storage copy to bucket ${bucketName}...`);
    const destination = `apk/${apkFileName}`;
    await storageBucket.upload(apkPath, {
      destination: destination,
      metadata: {
        contentType: 'application/vnd.android.package-archive',
        cacheControl: 'public, max-age=31536000'
      }
    });

    // Ensure the generated download path contains far-future access token signatures
    console.log("🔑 Generating far-future public signed URL...");
    const file = storageBucket.file(destination);
    const signedUrls = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2499' // Year 2499 far-future expiration
    });
    const gcsUrl = signedUrls[0];
    console.log(`✅ Firebase Storage Upload Succeeded! GCS URL: ${gcsUrl}`);
    
    console.log("📝 Updating database configurations with GCS URL...");
    await docRef.set({
      latestVersion: nextVersion,
      apkDownloadUrl: gcsUrl
    }, { merge: true });
  } catch (err) {
    console.warn("⚠️ Firebase Storage bucket missing or offline. Falling back to Vercel CDN distribution.");
    console.error(err);
    console.log("📝 Updating database configurations with Vercel CDN URL...");
    await docRef.set({
      latestVersion: nextVersion,
      apkDownloadUrl: publicUrl
    }, { merge: true });
  }

  // H. Run the Vercel production deployment command
  console.log("🚀 Launching synchronized production deployment push straight to Vercel...");
  execSync('vercel --prod --yes', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

  console.log(`\n🎉 Deployment Complete!`);
  console.log(`🔗 Deployed Version: ${nextVersion}`);
}

main().catch(err => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
