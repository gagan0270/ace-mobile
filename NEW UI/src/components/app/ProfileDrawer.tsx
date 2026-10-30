import { Drawer } from "vaul";
import { useRef, useState } from "react";
import { ChevronRight, LogOut, Settings, Bell, X, Camera, Trash2 } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { useNavigate } from "@tanstack/react-router";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { PhotoCropper } from "./PhotoCropper";

export function ProfileDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { photo, setPhoto } = useProfilePhoto();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPending(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[88vh] flex-col rounded-t-[32px] bg-background outline-none">
            <Drawer.Title className="sr-only">Profile</Drawer.Title>
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto w-full max-w-[440px] overflow-y-auto px-5 pt-6 pb-10 space-y-4">
              <section className="bg-card rounded-[28px] p-5 shadow-sm flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-foreground text-background font-extrabold text-[22px] flex items-center justify-center overflow-hidden">
                    {photo ? (
                      <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      "GV"
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center ring-2 ring-card hover:opacity-90 transition"
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
                  <div className="text-[18px] font-extrabold truncate">Gagan Venkatesh</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Pill tone="dark">2025-SATS-0091</Pill>
                    <Pill tone="muted">Grade 8 · Sec B</Pill>
                  </div>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <Camera className="w-3 h-3" />
                      {photo ? "Re-crop / change" : "Add photo"}
                    </button>
                    {photo && (
                      <button
                        onClick={() => setPhoto(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-card rounded-[28px] p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Personal & Academic
                </div>
                <Row label="Date of Birth" value="14 Mar 2011" />
                <Row label="Phone Number" value="+91 98450 12345" />
                <Row label="Guardian Name" value="Venkatesh R." />
                <Row label="Emergency Contact" value="+91 90080 45678" last />
              </section>

              <section className="bg-card rounded-[28px] p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Transport & Base Info
                </div>
                <Row label="Bus Route" value="Route 7 · Jayanagar" />
                <Row label="Room Base" value="Block C · Room 214" />
                <div className="flex items-center justify-between py-2.5">
                  <div className="text-[13px] text-muted-foreground">Active Session</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.16_155)] animate-pulse" />
                    <span className="text-[13px] font-semibold">Signed in · this device</span>
                  </div>
                </div>
              </section>

              <section className="bg-card rounded-[28px] p-2 shadow-sm">
                <ActionRow icon={Settings} label="App Settings" />
                <ActionRow icon={Bell} label="Notification Preferences" />
              </section>

              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/" });
                }}
                className="w-full h-12 rounded-2xl border border-[oklch(0.85_0.1_25)]/60 text-[oklch(0.55_0.18_25)] font-semibold text-[14px] hover:bg-[oklch(0.97_0.03_25)] transition inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {pending && (
        <PhotoCropper
          src={pending}
          onCancel={() => setPending(null)}
          onSave={(url) => {
            setPhoto(url);
            setPending(null);
          }}
        />
      )}
    </>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
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

function ActionRow({ icon: Icon, label }: { icon: typeof Settings; label: string }) {
  return (
    <button className="w-full flex items-center justify-between px-3 py-3.5 rounded-2xl hover:bg-accent transition">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center">
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <div className="text-[14px] font-semibold">{label}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
