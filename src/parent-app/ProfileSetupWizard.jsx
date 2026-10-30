import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Phone,
  Calendar,
  Camera,
  Upload,
  CheckCircle2,
  ArrowRight,
  User,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { AceLogo } from "../components/ui/AceLogo.jsx";
import { useProfilePhoto } from "../hooks/use-profile-photo.js";
import { db } from "../firebase.js";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { triggerHaptic } from "../lib/haptics.js";
import { cn } from "../lib/utils.js";
import { useTranslation } from "../lib/i18n.jsx";

/**
 * Format DOB string to "28 Aug 2007" (DD MMM YYYY)
 */
export function formatDobDisplay(dobString) {
  if (!dobString || dobString === "N/A") return "N/A";
  
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dobString)) {
    return dobString;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    const [year, monthNum, dayNum] = dobString.split("-").map(Number);
    const dateObj = new Date(year, monthNum - 1, dayNum);
    const day = String(dayNum).padStart(2, "0");
    const month = dateObj.toLocaleDateString("en-US", { month: "short" });
    return `${day} ${month} ${year}`;
  }

  const d = new Date(dobString);
  if (isNaN(d.getTime())) return dobString;

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

export function ProfileSetupWizard({ student, satsId, onComplete }) {
  const { language, setLanguage, t } = useTranslation();
  const [step, setStep] = useState(1);
  const { photo: existingPhoto, setPhoto } = useProfilePhoto();

  // Form State
  const [phone, setPhone] = useState(student?.phone || student?.mobile || student?.parentPhone || "");
  const [dob, setDob] = useState(student?.dob || student?.dateOfBirth || "2007-08-28");
  const [selectedPhoto, setSelectedPhoto] = useState(existingPhoto || student?.profilePicUrl || student?.profilePhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef(null);
  const cleanSats = String(satsId || student?.id || "").trim();

  // Step 2 Validation & Save
  const handleStep2Save = async (e) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      triggerHaptic("error");
      setError("Please enter a valid 10-digit mobile phone number.");
      return;
    }
    if (!dob) {
      triggerHaptic("error");
      setError("Please enter Date of Birth.");
      return;
    }

    setIsSaving(true);
    triggerHaptic("medium");

    try {
      if (selectedPhoto && !imageError) {
        setPhoto(selectedPhoto);
      }

      // Update Firestore student record
      if (db && cleanSats) {
        const studentRef = doc(db, "students", cleanSats);
        await updateDoc(studentRef, {
          phone: phone.trim(),
          parentPhone: phone.trim(),
          mobile: phone.trim(),
          dob: dob,
          dateOfBirth: dob,
          profilePicUrl: selectedPhoto || "",
          profilePhoto: selectedPhoto || "",
          photo: selectedPhoto || "",
          isProfileCompleted: true,
          isSetupComplete: true,
          preferredLanguage: language,
          updatedAt: serverTimestamp(),
        });
      }

      localStorage.setItem(`ace_setup_completed_${cleanSats.toLowerCase()}`, "true");
      localStorage.setItem(`ace_profile_completed_${cleanSats.toLowerCase()}`, "true");

      setStep(3); // Direct to completion step!
    } catch (err) {
      console.error("Save profile error:", err);
      setError("Failed to save profile. Please try again.");
      triggerHaptic("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle File Select & Base64 Compression
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadProgress(60);
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setUploadProgress(100);
        setSelectedPhoto(dataUrl);
        setImageError(false);
        setIsUploading(false);
        triggerHaptic("success");
      };

      img.onerror = () => {
        setIsUploading(false);
        setError("Failed to load image file.");
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-foreground/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-foreground/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2">
            <AceLogo size="md" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-foreground uppercase">
            Parent Account Setup
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            SATS ID: <strong className="text-foreground">{cleanSats}</strong>
          </p>

          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-2 mt-4">
            <div className={cn("w-7 h-1.5 rounded-full transition-all duration-300", step >= 1 ? "bg-foreground" : "bg-border")} />
            <div className={cn("w-7 h-1.5 rounded-full transition-all duration-300", step >= 2 ? "bg-foreground" : "bg-border")} />
            <div className={cn("w-7 h-1.5 rounded-full transition-all duration-300", step >= 3 ? "bg-emerald-500" : "bg-border")} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: LANGUAGE SELECTION ─────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                  Choose Portal Language
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Select your preferred language for dashboard navigation.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { code: "en", label: "English", native: "English" },
                  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
                  { code: "hi", label: "Hindi", native: "हिंदी" },
                ].map((langOption) => {
                  const isSelected = language === langOption.code;
                  return (
                    <button
                      key={langOption.code}
                      type="button"
                      onClick={() => {
                        setLanguage(langOption.code);
                        triggerHaptic("light");
                      }}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer",
                        isSelected
                          ? "bg-foreground text-background border-foreground font-black shadow-lg"
                          : "bg-accent/40 border-border/60 text-foreground hover:bg-accent/80 font-bold"
                      )}
                    >
                      <div>
                        <div className="text-sm">{langOption.native}</div>
                        <div className={cn("text-[11px]", isSelected ? "text-background/70 font-semibold" : "text-muted-foreground")}>
                          {langOption.label}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0 text-background" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setStep(2);
                }}
                className="w-full bg-foreground text-background font-extrabold text-xs py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: PROFILE DETAILS & PHOTO ────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleStep2Save} className="space-y-5">
                {/* Photo Upload Box */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-accent/30 shadow-inner">
                      {selectedPhoto && !imageError ? (
                        <img
                          src={selectedPhoto}
                          alt="Student Profile"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-foreground text-background p-2 rounded-full shadow-lg hover:scale-110 transition">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-[11px] font-bold text-muted-foreground mt-2">
                    {selectedPhoto ? "Tap photo to change" : "Upload Student Photo (Optional)"}
                  </p>
                </div>

                {/* Mobile Phone Field */}
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Parent Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setError(null);
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full bg-accent/40 border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth Field */}
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Student Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-accent/40 border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-foreground transition"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-semibold text-rose-500 text-center">{error}</p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3.5 rounded-2xl bg-accent text-foreground font-bold text-xs hover:bg-accent/80 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-2/3 bg-foreground text-background font-extrabold text-xs py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Setup</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── STEP 3: COMPLETION & CELEBRATION ───────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-2xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  {t("allSet")}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold max-w-xs">
                  {t("profileSyncedDesc")}
                </p>
              </div>

              <div className="w-full bg-accent/40 border border-border/60 rounded-2xl p-4 text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">Phone:</span>
                  <span className="font-extrabold text-foreground">+91 {phone}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">Date of Birth:</span>
                  <span className="font-extrabold text-foreground">{formatDobDisplay(dob)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("success");
                  onComplete({
                    ...student,
                    phone,
                    dob,
                    profilePicUrl: selectedPhoto,
                    isProfileCompleted: true,
                  });
                }}
                className="w-full bg-foreground text-background font-extrabold text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <span>{t("goToDashboard")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProfileSetupWizard;
