/**
 * haptics.js — Micro-Feedback Haptic Utility
 * Provides subtle physical tactile feedback for interactive elements
 */
export function triggerHaptic(type = "light") {
  if (typeof window === "undefined") return;
  try {
    if (navigator && typeof navigator.vibrate === "function") {
      switch (type) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(22);
          break;
        case "heavy":
          navigator.vibrate(35);
          break;
        case "error":
          navigator.vibrate([25, 40, 25]);
          break;
        case "success":
          navigator.vibrate([12, 25, 18]);
          break;
        case "selection":
          navigator.vibrate(8);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  } catch {
    /* Fallback if vibration permissions are restricted */
  }
}
