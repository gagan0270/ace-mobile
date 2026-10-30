import { useRef, useState, useEffect } from "react";
import { ChevronRight, LogOut, Settings, X, Camera, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill } from "../ui/pill.jsx";
import { useProfilePhoto } from "../../hooks/use-profile-photo.js";
import { PhotoCropper } from "./PhotoCropper.jsx";
import { AppSettingsModal } from "./AppSettingsModal.jsx";
import { triggerHaptic } from "../../lib/haptics.js";
import { ElasticScroll } from "./ElasticScroll.jsx";
import { useTranslation } from "../../lib/i18n.jsx";

import { formatDobDisplay } from "../../parent-app/ProfileSetupWizard.jsx";
import { APP_VERSION } from "../../constants.js";

export function ProfileDrawer({ open, onOpenChange, student, satsId, onLogout }) {
  const { t } = useTranslation();
  const { photo, setPhoto } = useProfilePhoto();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Lock background screen scroll when profile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      triggerHaptic("medium");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const studentName = student?.name || "Student Name";
  const studentClass = student?.class || student?.grade || "Class";
  const studentSection = student?.section || "Section";
  const rawBus = student?.assignedBusNumber ?? student?.busNumber ?? student?.bus ?? student?.transportBus ?? student?.route;
  const busStr = String(rawBus || "").trim().toLowerCase();
  const assignedBus = (!rawBus || rawBus === "—" || busStr === "" || busStr === "none" || busStr === "no bus" || busStr === "nobus" || busStr === "null")
    ? "Not Assigned"
    : String(rawBus);
  const assignedRoom = student?.room || student?.roomNumber || student?.roomBase || "Main Building";
  const rawDob = student?.dob || student?.dateOfBirth || "N/A";
  const dob = formatDobDisplay(rawDob);
  const phone = student?.phone || student?.mobile || student?.contactNumber || "N/A";
  const guardian = student?.guardianName || student?.parentName || "Guardian";

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic("light");
    const reader = new FileReader();
    reader.onload = () => setPending(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
            onClick={() => {
              triggerHaptic("light");
              onOpenChange(false);
            }}
          >
            <motion.div
              key="profile-sheet"
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 340,
                mass: 0.8,
              }}
              data-no-swipe="true"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="w-full max-w-[440px] h-[85vh] max-h-[85vh] bg-background rounded-t-[32px] p-5 shadow-2xl flex flex-col relative border-t border-border/40 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mt-1 mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30 shrink-0" />
              
              <button
                onClick={() => {
                  triggerHaptic("light");
                  onOpenChange(false);
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card border border-border/40 flex items-center justify-center text-foreground hover:bg-accent active:scale-95 transition cursor-pointer z-10"
                aria-label="Close profile"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Fully Scrollable Container with Elastic Overscroll Recoil Physics */}
              <ElasticScroll className="pt-2 pb-24 pr-1">
                <div className="space-y-4">
                  <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-foreground text-background font-extrabold text-[22px] flex items-center justify-center overflow-hidden ring-2 ring-border/50">
                        {photo ? (
                          <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          studentName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center ring-2 ring-card hover:opacity-90 active:scale-90 transition cursor-pointer"
                        aria-label="Change photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPickPhoto}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[18px] font-extrabold truncate text-foreground">{studentName}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Pill tone="dark">{satsId}</Pill>
                        <Pill tone="muted">{studentClass} · Sec {studentSection}</Pill>
                      </div>
                      <div className="mt-2 flex gap-3">
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          {photo ? "Re-crop / change" : "Add photo"}
                        </button>
                        {photo && (
                          <button
                            onClick={() => {
                              triggerHaptic("light");
                              setPhoto(null);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {t("personalAndAcademic")}
                    </div>
                    <Row label={t("dateOfBirth")} value={dob} />
                    <Row label={t("contactPhone")} value={phone} />
                    <Row label={t("guardian")} value={guardian} last />
                  </section>

                  <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {t("transportAndBase")}
                    </div>
                    <Row label={t("busRoute")} value={assignedBus} />
                    <Row label={t("roomBase")} value={assignedRoom} />
                    <div className="flex items-center justify-between py-2.5">
                      <div className="text-[13px] text-muted-foreground">{t("activeSession")}</div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[13px] font-semibold text-foreground">{t("signedInThisDevice")}</span>
                      </div>
                    </div>
                  </section>

                  <section className="bg-card rounded-[28px] p-2 shadow-sm border border-border/40">
                    <ActionRow icon={Settings} label={t("appSettings")} onClick={() => setShowSettingsModal(true)} />
                  </section>

                  {/* Logout Button with Highlighted Border */}
                  <button
                    onClick={() => {
                      triggerHaptic("heavy");
                      onOpenChange(false);
                      onLogout();
                    }}
                    className="w-full h-12 rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 text-rose-500 font-extrabold text-[14px] hover:bg-rose-500/20 active:scale-[0.98] transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("logOut")}
                  </button>

                  <div className="pt-2 pb-6 text-center select-none">
                    <div className="text-[12px] font-bold text-foreground">ACE Parent Portal</div>
                    <div className="text-[11px] font-medium text-muted-foreground mt-0.5">Version {APP_VERSION} (Build 11)</div>
                  </div>
                </div>
              </ElasticScroll>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pending && (
        <PhotoCropper
          src={pending}
          onCancel={() => setPending(null)}
          onSave={(url) => {
            triggerHaptic("success");
            setPhoto(url);
            setPending(null);
          }}
        />
      )}

      <AppSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}

function Row({ label, value, last }) {
  return (
    <div
      className={
        "flex items-center justify-between py-2.5 " +
        (last ? "" : "border-b border-border/60")
      }
    >
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="text-[13.5px] font-semibold text-foreground text-right ml-4 truncate">
        {value}
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={() => {
        triggerHaptic("light");
        if (onClick) onClick();
      }}
      className="w-full flex items-center justify-between px-3 py-3.5 rounded-2xl hover:bg-accent active:scale-[0.99] transition cursor-pointer text-foreground"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-background border border-border/40 flex items-center justify-center">
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <div className="text-[14px] font-semibold">{label}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
