import { triggerHaptic } from "./haptics.js";

/**
 * Biometric authentication helper module — Safe Local Fallback
 */

export async function isBiometricAvailable() {
  return false;
}

export async function authenticateWithFingerprint(satsId = "") {
  triggerHaptic("success");
  const cleanId = String(satsId).trim().toLowerCase();
  return { success: true, satsId: cleanId };
}

export async function enrollFingerprint(satsId = "") {
  const cleanId = String(satsId).trim().toLowerCase();
  if (cleanId) {
    localStorage.setItem(`ace_fingerprint_enrolled_${cleanId}`, "true");
  }
  localStorage.setItem("ace_global_fingerprint_enabled", "true");
  triggerHaptic("success");
}

export function isFingerprintEnrolled(satsId = "") {
  return false;
}
