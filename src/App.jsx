/**
 * App.jsx — ACE Parent Mobile Application Root
 * Routes: /parent/login → /parent/force-password-reset → /parent/verification → /parent/dashboard
 */
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginGateway from "./parent-app/LoginGateway.jsx";
import ForcePasswordResetScreen from "./parent-app/ForcePasswordResetScreen.jsx";
import ProfileSetupWizard from "./parent-app/ProfileSetupWizard.jsx";
import AppShell from "./components/app/AppShell.jsx";
import { clearAllCaches } from "./hooks/useLocalCache.js";
import { auth, db } from "./firebase.js";
import { doc, getDoc, collection, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AceLogo } from "./components/ui/AceLogo.jsx";
import SplashScreen from "./components/app/SplashScreen.jsx";
import { checkMustChangePassword } from "./lib/passwordCheck.js";
import { App as CapApp } from "@capacitor/app";

/**
 * Check if student profile details are incomplete or if onboarding setup is required
 */
export function checkIsProfileSetupRequired(student) {
  if (!student) return false;
  const cleanSats = String(student.id || student.satsId || "").trim().toLowerCase();

  // 1. Persistent Boolean Flag Check (Firestore Document)
  const isSetupCompleteInDoc =
    student.isSetupComplete === true ||
    student.isSetupComplete === "true" ||
    student.isProfileCompleted === true ||
    student.isProfileCompleted === "true";

  // 2. Persistent Local Storage Flag Check
  const isSetupCompleteLocally =
    localStorage.getItem(`ace_setup_completed_${cleanSats}`) === "true" ||
    localStorage.getItem(`ace_profile_completed_${cleanSats}`) === "true";

  // If either persistent flag is true, setup is complete! Straight to dashboard!
  if (isSetupCompleteInDoc || isSetupCompleteLocally) {
    return false;
  }

  // Fallback field presence check for first time login
  const hasPhone = !!(student.phone || student.mobile || student.parentPhone);
  const hasDob = !!(student.dob || student.dateOfBirth);

  if (hasPhone && hasDob) {
    localStorage.setItem(`ace_setup_completed_${cleanSats}`, "true");
    return false;
  }

  return true;
}

// ─── Profile Verification Screen ─────────────────────────────────────────────
function ProfileVerification({ student, onVerify, onReject }) {
  const isMale =
    student?.gender?.toLowerCase() === "male" ||
    student?.gender?.toLowerCase() === "boy";
  const avatarEmoji = isMale ? "👦" : "👧";
  const studentName = student?.name || student?.studentName || "Student Name";
  const studentClass = student?.class || student?.grade || "Class";
  const studentSection = student?.section || "Section";
  const photoUrl = student?.profilePicUrl || student?.profilePhoto || student?.photo;

  return (
    <div className="min-h-dvh w-full bg-background flex flex-col items-center justify-center px-6 text-center safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card text-foreground rounded-[32px] p-8 w-full max-w-sm flex flex-col items-center border border-border shadow-2xl relative overflow-hidden select-none"
      >
        <AceLogo size="md" className="mb-6" />

        <div className="w-24 h-24 rounded-full border-2 border-border bg-accent flex items-center justify-center text-5xl mb-4 shadow-xl ring-4 ring-border/20 overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
          ) : (
            avatarEmoji
          )}
        </div>

        <h1 className="text-xl font-black tracking-tight text-foreground uppercase mb-1 leading-none">
          {studentName}
        </h1>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Please confirm your child's profile
        </p>

        <div className="flex items-center justify-center gap-3 mb-8 w-full">
          <div className="bg-accent/60 border border-border/60 rounded-2xl px-4 py-2.5 flex-1">
            <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">
              Class
            </span>
            <span className="text-sm font-extrabold text-foreground uppercase">
              {studentClass}
            </span>
          </div>
          <div className="bg-accent/60 border border-border/60 rounded-2xl px-4 py-2.5 flex-1">
            <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">
              Section
            </span>
            <span className="text-sm font-extrabold text-foreground uppercase">
              {studentSection}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onVerify}
          className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-xl active:scale-95"
        >
          YES, THIS IS MY CHILD
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onReject}
          className="w-full py-3.5 mt-3 rounded-2xl bg-transparent border border-rose-500/50 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-all cursor-pointer active:scale-95"
        >
          NO, THIS IS NOT MY CHILD
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── App Content (Login / Force Password Reset / Verification / AppShell router) ─
function AppContent() {
  const initialRememberedSats =
    typeof window !== "undefined"
      ? (localStorage.getItem("ace_remember_sats_id") || localStorage.getItem("ace_sats_id") || "")
      : "";
  const initialIsLoggedIn =
    typeof window !== "undefined"
      ? localStorage.getItem("ace_is_logged_in") === "true"
      : false;

  const [satsId, setSatsId] = useState(() => (initialIsLoggedIn && initialRememberedSats ? initialRememberedSats : null));
  const [studentData, setStudentData] = useState(() => {
    if (initialIsLoggedIn && initialRememberedSats) {
      try {
        const cached = localStorage.getItem(`ace_parent_student_${initialRememberedSats}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [isSessionUnlocked, setIsSessionUnlocked] = useState(() => initialIsLoggedIn && !!initialRememberedSats);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isProfileSetupRequired, setIsProfileSetupRequired] = useState(false);
  const [isProfileVerified, setIsProfileVerified] = useState(false);
  const [splashPhase, setSplashPhase] = useState("loading"); // "loading" | "fadeout" | "complete"

  const splashStartTime = useRef(Date.now());
  const isLoggedInRef = useRef(false);

  const evaluateStudentState = (student, notifs = []) => {
    if (checkMustChangePassword(student, notifs)) {
      setMustChangePassword(true);
      setIsProfileSetupRequired(false);
    } else if (checkIsProfileSetupRequired(student)) {
      setMustChangePassword(false);
      setIsProfileSetupRequired(true);
    } else {
      setMustChangePassword(false);
      setIsProfileSetupRequired(false);
    }
  };

  // ── Global App Reset & Re-setup Listener ─────────────────────────────────
  useEffect(() => {
    const handleForceReset = async () => {
      try {
        await signOut(auth);
      } catch {}
      try {
        localStorage.clear();
      } catch {}
      try {
        sessionStorage.clear();
      } catch {}
      clearAllCaches();
      setSatsId(null);
      setStudentData(null);
      setIsSessionUnlocked(false);
      setMustChangePassword(false);
      setIsProfileSetupRequired(false);
      setIsProfileVerified(false);
      window.location.replace(window.location.origin + window.location.pathname);
    };

    window.addEventListener("ace:force-reset-app", handleForceReset);
    return () => window.removeEventListener("ace:force-reset-app", handleForceReset);
  }, []);

  // ── Capacitor App Background Resume Listener ──────────────────────────────
  useEffect(() => {
    let listener = null;
    const setupListener = async () => {
      try {
        listener = await CapApp.addListener("appStateChange", ({ isActive }) => {
          // Do not re-trigger splash screen on system dialog/biometric resume to prevent black screens
        });
      } catch (err) {
        console.warn("Capacitor App listener not attached:", err);
      }
    };
    setupListener();

    return () => {
      if (listener && typeof listener.remove === "function") {
        listener.remove();
      }
    };
  }, []);

  // ── Real-time Firestore Student Document & Notifications Listener ─────────
  useEffect(() => {
    if (!satsId || !db || !isSessionUnlocked) return;

    const cleanSats = satsId.trim();
    const studentRef = doc(db, "students", cleanSats);
    const notificationsRef = collection(db, "students", cleanSats, "notifications");

    let currentStudent = null;
    let currentNotifs = [];

    const unsubStudent = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          currentStudent = { id: docSnap.id, ...docSnap.data() };
          setStudentData(currentStudent);
          evaluateStudentState(currentStudent, currentNotifs);
        }
      },
      (err) => console.error("Real-time student snapshot error:", err)
    );

    const unsubNotifs = onSnapshot(
      query(notificationsRef),
      (snap) => {
        const notifs = [];
        snap.forEach((d) => notifs.push({ id: d.id, ...d.data() }));
        currentNotifs = notifs;

        if (currentStudent) {
          evaluateStudentState(currentStudent, currentNotifs);
        }
      },
      (err) => console.warn("Real-time notifications snapshot error:", err)
    );

    return () => {
      unsubStudent();
      unsubNotifs();
    };
  }, [satsId, isSessionUnlocked]);

  // ── Firebase Auth Session Restore & Fast Cold-Start Splash Resolver ─────────
  useEffect(() => {
    let hasResolved = false;

    // Preload logo image into browser cache
    const img = new Image();
    img.src = "/logo.png";

    const resolveSplash = () => {
      if (hasResolved) return;
      hasResolved = true;

      const elapsed = Date.now() - splashStartTime.current;
      // Target under 1.2s total cold-start: brief 750ms minimum so splash is smooth
      const delay = Math.max(0, 750 - elapsed);

      setTimeout(() => {
        setSplashPhase("fadeout");
        setTimeout(() => {
          setSplashPhase("complete");
        }, 220);
      }, delay);
    };

    // Strict maximum splash duration safety guard (1200ms)
    const fallbackTimer = setTimeout(() => {
      resolveSplash();
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const emailLocal = firebaseUser.email?.split("@")[0]?.toUpperCase();
          if (!emailLocal) throw new Error("Invalid auth email format");

          const studentDoc = await getDoc(doc(db, "students", emailLocal));
          if (studentDoc.exists()) {
            const student = { id: studentDoc.id, ...studentDoc.data() };
            setSatsId(emailLocal);
            setStudentData(student);
            if (localStorage.getItem("ace_is_logged_in") === "true") {
              setIsSessionUnlocked(true);
              evaluateStudentState(student);
            }
          } else {
            await signOut(auth);
          }
        } catch (err) {
          console.warn("Session restore failed:", err?.message || err);
          await signOut(auth).catch(() => {});
        }
      } else {
        // Fallback: check if an active saved session exists in local storage
        const savedLoggedIn = localStorage.getItem("ace_is_logged_in") === "true";
        const savedId = localStorage.getItem("ace_sats_id");
        if (savedLoggedIn && savedId) {
          try {
            const studentDoc = await getDoc(doc(db, "students", savedId.toUpperCase()));
            if (studentDoc.exists()) {
              const student = { id: studentDoc.id, ...studentDoc.data() };
              setSatsId(savedId.toUpperCase());
              setStudentData(student);
              setIsSessionUnlocked(true);
              evaluateStudentState(student);
            }
          } catch (err) {
            console.warn("Local session student fetch fallback failed:", err?.message || err);
          }
        }
      }
      clearTimeout(fallbackTimer);
      resolveSplash();
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  // EXPLICIT VERIFICATION HANDLER (Called on successful password login)
  const handleAuthenticated = (id, student) => {
    setSatsId(id);
    setStudentData(student);
    setIsSessionUnlocked(true); // UNLOCK SESSION
    localStorage.setItem("ace_is_logged_in", "true");
    setIsProfileVerified(false);
    evaluateStudentState(student);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
    localStorage.removeItem("ace_is_logged_in");
    localStorage.removeItem("ace_sats_id");
    // Preserve remembered SATS ID unless remember me was explicitly disabled
    if (localStorage.getItem("ace_remember_me") === "false") {
      localStorage.removeItem("ace_remember_sats_id");
    }
    clearAllCaches();
    localStorage.removeItem("ota_dismissed_version");
    setSatsId(null);
    setStudentData(null);
    setIsSessionUnlocked(false);
    setMustChangePassword(false);
    setIsProfileSetupRequired(false);
    setIsProfileVerified(false);
  };

  const handleRejectChild = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error on reject:", err);
    }
    localStorage.removeItem("ace_is_logged_in");
    localStorage.removeItem("ace_sats_id");
    if (localStorage.getItem("ace_remember_me") === "false") {
      localStorage.removeItem("ace_remember_sats_id");
    }
    clearAllCaches();
    setSatsId(null);
    setStudentData(null);
    setIsSessionUnlocked(false);
    setMustChangePassword(false);
    setIsProfileSetupRequired(false);
    setIsProfileVerified(false);
  };

  // STRICT ACCESS GATE: Requires both SatsID and explicit session unlock via biometric/password!
  const isLoggedIn = !!satsId && isSessionUnlocked;

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  return (
    <div className="relative min-h-dvh w-full bg-[#000000] text-foreground">
      {/* 1. Seamless Router with ZERO Splash Overlap */}
      <AnimatePresence mode="wait">
        {splashPhase !== "complete" ? (
          <motion.div
            key="app-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-[#000000]"
          >
            <SplashScreen isExiting={splashPhase === "fadeout"} />
          </motion.div>
        ) : !isLoggedIn ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-dvh w-full bg-background"
          >
            <LoginGateway
              initialSatsId={initialRememberedSats}
              onAuthenticated={handleAuthenticated}
            />
          </motion.div>
        ) : mustChangePassword ? (
          <motion.div
            key="force-password-reset"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="min-h-dvh w-full"
          >
            <ForcePasswordResetScreen
              satsId={satsId}
              student={studentData}
              onComplete={(updatedStudent) => {
                const freshData = updatedStudent || studentData;
                setStudentData(freshData);
                setMustChangePassword(false);
                if (checkIsProfileSetupRequired(freshData)) {
                  setIsProfileSetupRequired(true);
                } else {
                  setIsProfileVerified(true);
                }
              }}
            />
          </motion.div>
        ) : isProfileSetupRequired ? (
          <motion.div
            key="profile-setup-wizard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="min-h-dvh w-full"
          >
            <ProfileSetupWizard
              satsId={satsId}
              student={studentData}
              onComplete={(updatedStudent) => {
                if (updatedStudent) {
                  setStudentData((prev) => ({ ...prev, ...updatedStudent }));
                }
                setIsProfileSetupRequired(false);
                setIsProfileVerified(true);
              }}
            />
          </motion.div>
        ) : !isProfileVerified ? (
          <motion.div
            key="verification"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="min-h-dvh w-full bg-background"
          >
            <ProfileVerification
              student={studentData}
              onVerify={() => setIsProfileVerified(true)}
              onReject={handleRejectChild}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-dvh w-full bg-background"
          >
            <AppShell
              satsId={satsId}
              initialStudent={studentData}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root App Component ───────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="w-full min-h-dvh bg-[#000000] text-foreground flex flex-col overflow-x-hidden">
      <AppContent />
    </div>
  );
}
