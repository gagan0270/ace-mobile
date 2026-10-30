import { useState } from "react";
import { X, ArrowLeft, Globe, Trash2, CheckCircle2, Check, RefreshCw, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "../../lib/haptics.js";
import { clearAllCaches } from "../../hooks/useLocalCache.js";
import { cn } from "../../lib/utils.js";
import { useTranslation } from "../../lib/i18n.jsx";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी", flag: "🇮🇳" },
];

export function AppSettingsModal({ open, onClose }) {
  const { language, setLanguage, t } = useTranslation();
  const [showToast, setShowToast] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    triggerHaptic("selection");
  };

  const handleClearCache = () => {
    setIsClearing(true);
    triggerHaptic("medium");

    setTimeout(() => {
      clearAllCaches();
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((k) => {
          if (
            k.startsWith("ace_cache_") ||
            k.includes("notices") ||
            k.includes("fees") ||
            k.startsWith("ace_profile_completed_") ||
            k.startsWith("ace_fingerprint_enrolled_") ||
            k === "ace_global_fingerprint_enabled"
          ) {
            localStorage.removeItem(k);
          }
        });
      } catch {}

      window.dispatchEvent(new Event("ace:cache-cleared"));
      setIsClearing(false);
      setShowToast(true);
      triggerHaptic("success");

      setTimeout(() => setShowToast(false), 3500);
    }, 400);
  };

  const handleResetAndReSetup = () => {
    triggerHaptic("heavy");
    if (window.confirm("Are you sure you want to reset the app? This will wipe all stored data and restart profile setup from scratch.")) {
      window.dispatchEvent(new Event("ace:force-reset-app"));
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="settings-card"
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border/80 rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-foreground font-bold shadow-xs">
                <Globe className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground tracking-tight">
                  {t("appSettings")}
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Language & Cache Control
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-accent/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold p-3 rounded-2xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("cacheClearedSuccess")}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preferred Language Section */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {t("preferredLanguage")}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition transform active:scale-[0.99] cursor-pointer",
                      isSelected
                        ? "bg-accent/80 border-foreground ring-2 ring-foreground/20 text-foreground shadow-sm"
                        : "bg-card border-border/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <div>
                        <div className="text-xs font-extrabold text-foreground">
                          {lang.label}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground">
                          {lang.nativeLabel}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/60 bg-transparent"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage & Clear Cache Section */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Storage & Reset
              </span>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3 shadow-xs">
              <div>
                <div className="text-xs font-extrabold text-foreground">
                  {t("clearAppCache")}
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed mt-0.5">
                  {t("refreshCacheDesc")}
                </p>
              </div>

              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs hover:bg-amber-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("clearAppCache")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Reset App / Start From Scratch Button */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2 shadow-xs">
              <div>
                <div className="text-xs font-extrabold text-rose-500">
                  Reset App & Re-Setup Profile
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed mt-0.5">
                  Completely erase all stored student profile data, language preferences, and fingerprint credentials, restarting onboarding from scratch.
                </p>
              </div>

              <button
                onClick={handleResetAndReSetup}
                className="w-full py-3 rounded-xl bg-rose-500 text-white font-extrabold text-xs hover:bg-rose-600 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset App / Start From Scratch</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AppSettingsModal;
