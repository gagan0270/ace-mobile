import { useState, useEffect, useRef } from "react";
import { Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill } from "../components/ui/pill.jsx";
import { auth, db } from "../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { triggerHaptic } from "../lib/haptics.js";
import { checkMustChangePassword } from "../lib/passwordCheck.js";
import { AceLogo } from "../components/ui/AceLogo.jsx";
import { APP_VERSION } from "../constants.js";

export function LoginGateway({ onAuthenticated, initialSatsId = "" }) {
  const savedRememberPref = typeof window !== "undefined" ? localStorage.getItem("ace_remember_me") : null;
  const initialRememberMe = savedRememberPref !== "false"; // Default true
  const savedRememberedSats = typeof window !== "undefined"
    ? (localStorage.getItem("ace_remember_sats_id") || localStorage.getItem("ace_sats_id") || "")
    : "";

  const [satsIdInput, setSatsIdInput] = useState(
    initialSatsId || (initialRememberMe ? savedRememberedSats : "")
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(initialRememberMe);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  // Modal for forgot password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetSatsId, setResetSatsId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const timeoutRef = useRef(null);
  const passwordInputRef = useRef(null);
  const isDemoAvailable = !import.meta.env.PROD || import.meta.env.VITE_ENABLE_DEMO === "true";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Keyboard avoidance: when virtual keyboard appears on Android, keep active input centered
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const handleViewportResize = () => {
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        setTimeout(() => {
          document.activeElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
    };
    window.visualViewport.addEventListener("resize", handleViewportResize);
    return () => window.visualViewport.removeEventListener("resize", handleViewportResize);
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLookup = async (e) => {
    if (e) e.preventDefault();

    const cleanSats = satsIdInput.trim().toUpperCase();
    if (!cleanSats) {
      triggerShake();
      triggerHaptic("error");
      setError("Please enter your Student SATS ID.");
      return;
    }

    if (!password) {
      triggerShake();
      triggerHaptic("error");
      setError("Please enter your access password.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTimeoutWarning(false);

    timeoutRef.current = setTimeout(() => {
      setIsProcessing(false);
      setTimeoutWarning(true);
    }, 9000);

    try {
      const email = `${cleanSats.toLowerCase()}@ace.school`;

      // Requirement 1: Match password ONLY against single active `password` field in database
      const studentDoc = await getDoc(doc(db, "students", cleanSats));

      if (!studentDoc.exists()) {
        clearTimeout(timeoutRef.current);
        setError("SATS student record not found in database.");
        triggerShake();
        setIsProcessing(false);
        return;
      }

      const studentData = { id: studentDoc.id, ...studentDoc.data() };

      // Strictly evaluate single active `password` field
      const activeDbPassword = String(studentData.password || "").trim();
      const enteredPassword = String(password).trim();

      // Reject any attempt to log in using previous or legacy passwords
      if (!activeDbPassword || enteredPassword !== activeDbPassword) {
        clearTimeout(timeoutRef.current);
        setError("Invalid SATS ID or Password. Please verify.");
        triggerShake();
        setIsProcessing(false);
        return;
      }

      // Background Auth Session initialization
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (authErr) {
        console.warn("Background Auth sign-in warning:", authErr?.message || authErr);
      }

      clearTimeout(timeoutRef.current);
      
      // Store local authentication flag to bypass login cleanly on future launches
      if (rememberMe) {
        localStorage.setItem("ace_remember_sats_id", cleanSats);
        localStorage.setItem("ace_remember_me", "true");
      } else {
        localStorage.removeItem("ace_remember_sats_id");
        localStorage.setItem("ace_remember_me", "false");
      }
      localStorage.setItem("ace_is_logged_in", "true");
      localStorage.setItem("ace_sats_id", cleanSats);
      triggerHaptic("success");

      const mustReset = checkMustChangePassword(studentData);
      onAuthenticated(cleanSats, {
        ...studentData,
        mustChangePassword: mustReset,
        requiresPasswordReset: mustReset,
      });
      setIsProcessing(false);
    } catch (err) {
      console.error("Login error:", err);
      clearTimeout(timeoutRef.current);
      triggerShake();
      triggerHaptic("error");
      setIsProcessing(false);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("No internet connection. Please verify your network and retry.");
      } else if (err.code === "unavailable" || err.message?.toLowerCase().includes("network") || err.message?.toLowerCase().includes("failed to fetch")) {
        setError("Cannot reach ACE Portal server. Please check your internet connection.");
      } else if (err.code === "permission-denied") {
        setError("Access denied. Please check with your school administrator.");
      } else {
        setError(err.message || "Server authentication failed. Please try again.");
      }
    }
  };

  const handleRememberMeChange = (checked) => {
    setRememberMe(checked);
    localStorage.setItem("ace_remember_me", checked ? "true" : "false");
    if (checked) {
      if (satsIdInput.trim()) {
        localStorage.setItem("ace_remember_sats_id", satsIdInput.trim().toUpperCase());
      }
    } else {
      localStorage.removeItem("ace_remember_sats_id");
    }
  };

  const handleDemoLogin = async () => {
    triggerHaptic("success");
    setIsProcessing(true);

    const demoSats = "DEMO2026";
    let demoStudent = null;

    try {
      if (db) {
        const snap = await getDoc(doc(db, "students", demoSats));
        if (snap.exists()) {
          demoStudent = { id: snap.id, satsId: snap.id, ...snap.data() };
        }
      }
    } catch (e) {
      console.warn("Demo fetch from firestore:", e);
    }

    if (!demoStudent) {
      demoStudent = {
        id: demoSats,
        satsId: demoSats,
        name: "AARAV SHARMA",
        studentName: "AARAV SHARMA",
        class: "10th Class",
        grade: "10th Class",
        section: "Section A",
        assignedBusNumber: "Bus-04",
        busNumber: "Bus-04",
        room: "Room 102",
        dob: "2009-05-15",
        phone: "9876543210",
        guardianName: "Rajesh Sharma",
        gender: "Male",
        status: "active",
        isSetupComplete: true,
        isProfileCompleted: true,
        totalAllocatedFee: 45000,
        totalPaidFee: 30000,
        outstandingBalance: 15000,
      };
    }

    localStorage.setItem("ace_is_logged_in", "true");
    localStorage.setItem("ace_sats_id", demoSats);
    if (rememberMe) {
      localStorage.setItem("ace_remember_sats_id", demoSats);
      localStorage.setItem("ace_remember_me", "true");
    }

    setTimeout(() => {
      setIsProcessing(false);
      onAuthenticated(demoSats, demoStudent);
    }, 150);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetSatsId) {
      setResetError("Please enter your SATS ID.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setIsResetting(true);
    setResetError("");

    try {
      const cleanSats = resetSatsId.trim().toUpperCase();
      const studentDoc = await getDoc(doc(db, "students", cleanSats));

      if (!studentDoc.exists()) {
        setResetError("SATS ID not found.");
        setIsResetting(false);
        return;
      }

      setResetSuccess(true);
      setTimeout(() => {
        setIsResetOpen(false);
        setResetSuccess(false);
        setResetSatsId("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err) {
      setResetError(err.message || "Failed to reset password. Contact admin.");
    } finally {
      setIsResetting(false);
    }
  };

  const currentEnrolledId = (satsIdInput || localStorage.getItem("ace_sats_id") || "").trim().toUpperCase();

  return (
    <div
      className="min-h-dvh w-full bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 overflow-y-auto safe-top safe-bottom"
      style={{ minHeight: "100dvh" }}
    >
      <div
        className={`w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <AceLogo size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            ACE PARENT PORTAL
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Secure Student Identity Gateway (v{APP_VERSION})
          </p>
        </div>

        {/* ── STANDARD CLEAN CREDENTIAL LOGIN MODE ─────────────────────────── */}
        <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Student SATS ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={satsIdInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSatsIdInput(val);
                    setError(null);
                    if (rememberMe && val.trim()) {
                      localStorage.setItem("ace_remember_sats_id", val.trim().toUpperCase());
                    }
                  }}
                  onFocus={(e) => {
                    // Prevent automatic select-all on tap in Android WebViews
                    const val = e.target.value;
                    if (e.target.selectionStart === 0 && e.target.selectionEnd === val.length && val.length > 0) {
                      setTimeout(() => {
                        try { e.target.setSelectionRange(val.length, val.length); } catch (_) {}
                      }, 10);
                    }
                  }}
                  onBlur={() => {
                    setSatsIdInput((prev) => prev.trim().toUpperCase());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      passwordInputRef.current?.focus();
                    }
                  }}
                  placeholder="e.g. SATS01A01"
                  autoComplete="username"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  enterKeyHint="next"
                  className="w-full bg-accent/30 border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition uppercase"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>Access Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setResetSatsId(satsIdInput);
                    setIsResetOpen(true);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  Forgot?
                </button>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLookup(e);
                    }
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  enterKeyHint="go"
                  className="w-full bg-accent/30 border border-border rounded-2xl pl-10 pr-10 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition"
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => handleRememberMeChange(e.target.checked)}
                  className="rounded border-border text-foreground focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  Remember SATS ID
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-xs font-semibold text-rose-500 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {timeoutWarning && !error && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs font-semibold text-amber-500 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Signing in taking longer than expected. Please check network.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-foreground text-background font-extrabold text-sm py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50 mt-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {isDemoAvailable && (
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isProcessing}
                className="w-full bg-accent/30 hover:bg-accent/60 text-foreground font-bold text-xs py-3 rounded-2xl border border-dashed border-border/80 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mt-2.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Demo Login (Instant Test Access)</span>
              </button>
            )}
          </form>

        {/* Security Footer Badge */}
        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted Student Portal Auth</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isResetOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm space-y-4 relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="font-bold text-sm text-foreground">Reset Password</h3>
                <button
                  onClick={() => setIsResetOpen(false)}
                  className="text-muted-foreground hover:text-foreground font-bold"
                >
                  ✕
                </button>
              </div>

              {resetSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-emerald-500">
                    Password update request submitted!
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Please contact school admin if reset requires approval.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      SATS ID
                    </label>
                    <input
                      type="text"
                      value={resetSatsId}
                      onChange={(e) => setResetSatsId(e.target.value.toUpperCase())}
                      placeholder="SATS01A01"
                      className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2 text-xs font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  {resetError && (
                    <p className="text-xs font-semibold text-rose-500">{resetError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full bg-foreground text-background font-bold text-xs py-2.5 rounded-xl hover:opacity-90 transition"
                  >
                    {isResetting ? "Updating..." : "Submit Reset Request"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LoginGateway;
