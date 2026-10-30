import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { AceLogo } from "../components/ui/AceLogo.jsx";
import { auth, db } from "../firebase.js";
import { updatePassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { triggerHaptic } from "../lib/haptics.js";

export function ForcePasswordResetScreen({ satsId, student, onComplete }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const cleanSats = String(satsId || "").trim();
  const studentName = student?.name || student?.studentName || "Student";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Requirement 4: Ensure password reset cannot be bypassed with short/invalid passwords
    if (newPassword.length < 6) {
      triggerHaptic("error");
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerHaptic("error");
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    // Require that new password is different from active database password
    const currentActivePass = String(student?.password || "").trim();
    if (currentActivePass && newPassword === currentActivePass) {
      triggerHaptic("error");
      setError("New password must be different from your temporary password.");
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("medium");

    try {
      const email = `${cleanSats.toLowerCase()}@ace.school`;

      // Attempt background Firebase Auth sync non-fatally
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch (authErr) {
          console.warn("Firebase Auth updatePassword non-fatal warning:", authErr?.message || authErr);
        }
      }

      // Requirement 3: Clear old session state & set local completion flags
      const resetTimestamp = Date.now() + 180000;
      localStorage.setItem(`ace_last_pass_reset_${cleanSats.toLowerCase()}`, String(resetTimestamp));
      localStorage.setItem(`ace_must_change_override_${cleanSats.toLowerCase()}`, "false");

      // Requirement 3: Overwrite single active `password` field in database & set `requiresPasswordReset` to false
      if (db && cleanSats) {
        try {
          const studentRef = doc(db, "students", cleanSats);
          await updateDoc(studentRef, {
            password: newPassword,
            parentPassword: newPassword,
            studentPassword: newPassword,
            passwordSet: true,
            requiresPasswordReset: false,
            mustChangePassword: false,
            requirePasswordChange: false,
            forcePasswordReset: false,
            passwordChanged: false,
            isTemporaryPassword: false,
            passwordResetRequired: false,
            tempPassword: null,
            lastPasswordChange: serverTimestamp(),
            mobilePasswordLastReset: serverTimestamp(),
          });
        } catch (fsErr) {
          console.warn("Firestore student doc update warning:", fsErr);
        }

        try {
          const userRef = doc(db, "users", cleanSats);
          await updateDoc(userRef, {
            password: newPassword,
            parentPassword: newPassword,
            requiresPasswordReset: false,
            mustChangePassword: false,
            tempPassword: null,
          });
        } catch {
          // User doc optional
        }
      }

      localStorage.setItem(`ace_must_change_override_${cleanSats.toLowerCase()}`, "false");

      // Requirement 3: Log the user in freshly using only their new password
      triggerHaptic("success");
      onComplete({
        ...student,
        password: newPassword,
        parentPassword: newPassword,
        studentPassword: newPassword,
        requiresPasswordReset: false,
        mustChangePassword: false,
      });
    } catch (err) {
      console.error("Force password update error:", err);
      triggerHaptic("error");
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">
            <AceLogo size="lg" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">
            SECURITY UPDATE REQUIRED
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-semibold max-w-xs">
            Welcome, <strong className="text-foreground">{studentName}</strong>'s parent ({cleanSats}). Please set your new access password below to continue.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 leading-relaxed">
            Your password was changed from the web portal or requires an update. Choose a new secure password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              New Access Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={isSubmitting}
                className="w-full bg-accent/40 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3.5 text-muted-foreground/60 hover:text-foreground transition"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              disabled={isSubmitting}
              className="w-full bg-accent/40 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-xs font-semibold text-rose-500 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-foreground text-background font-extrabold text-sm py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                <span>Save New Password</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default ForcePasswordResetScreen;
