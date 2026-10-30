import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldCheck, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [sats, setSats] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/app" }), 400);
  };

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#111] text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-7 h-7" strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">
            ACE Parent Portal
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-center">
            Secure Student Identity Gateway
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-card rounded-[28px] shadow-sm p-6 space-y-5"
        >
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Student SATS ID
            </label>
            <input
              value={sats}
              onChange={(e) => setSats(e.target.value)}
              placeholder="e.g. 2025-SATS-0091"
              className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-[15px] font-medium outline-none focus:border-foreground/60 transition"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Access Password
            </label>
            <div className="relative">
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type={showPass ? "text" : "password"}
                placeholder="Enter your access password"
                className="w-full h-12 px-4 pr-12 rounded-2xl bg-background border border-border text-[15px] font-medium outline-none focus:border-foreground/60 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-[#111] rounded"
              />
              <span className="text-foreground/80">Remember me</span>
            </label>
            <a href="#" className="font-semibold text-foreground hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#111] text-white font-semibold text-[15px] hover:bg-[#000] active:scale-[0.99] transition disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify & Access"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted-foreground leading-relaxed px-4">
          <ShieldCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
          Enter the SATS ID and password shared by your school. Sessions are encrypted end-to-end.
        </p>
      </div>
    </main>
  );
}
