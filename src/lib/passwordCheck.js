/**
 * Helper utility to determine if a student profile requires a forced password reset.
 * Evaluates Firestore fields (requiresPasswordReset, forcePasswordChange, tempPassword, etc.)
 */
export function checkMustChangePassword(student) {
  if (!student) return false;

  const satsIdClean = String(student.id || student.satsId || "").trim().toLowerCase();

  // PRIORITY 1: Explicit Admin Force-Reset Flag (ALWAYS TRUMPS EVERYTHING!)
  const adminForceFlag =
    student.requiresPasswordReset === true ||
    student.requiresPasswordReset === "true" ||
    student.forcePasswordChange === true ||
    student.forcePasswordChange === "true" ||
    student.mustChangePassword === true ||
    student.mustChangePassword === "true" ||
    student.requirePasswordChange === true ||
    student.requirePasswordChange === "true" ||
    student.passwordResetRequired === true ||
    student.passwordResetRequired === "true" ||
    student.isTemporaryPassword === true ||
    student.isTemporaryPassword === "true" ||
    !!student.tempPassword;

  if (adminForceFlag) {
    localStorage.removeItem(`ace_must_change_override_${satsIdClean}`);
    return true;
  }

  // PRIORITY 2: Explicit False Flag on Student Doc (Password updated by user)
  if (
    student.requiresPasswordReset === false ||
    student.forcePasswordChange === false ||
    student.mustChangePassword === false
  ) {
    localStorage.setItem(`ace_must_change_override_${satsIdClean}`, "false");
    return false;
  }

  // PRIORITY 3: Local Override from completed force-reset session
  const override = localStorage.getItem(`ace_must_change_override_${satsIdClean}`);
  if (override === "false") {
    return false;
  }

  return false;
}
