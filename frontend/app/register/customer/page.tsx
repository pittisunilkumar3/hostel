"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerRegister() {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleActive, setGoogleActive] = useState(false);
  const [twilioActive, setTwilioActive] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const gd = await (await fetch("http://localhost:3001/api/settings/google-status")).json();
        if (gd.success && gd.data.active) { setGoogleActive(true); setGoogleClientId(gd.data.clientId); }
        const td = await (await fetch("http://localhost:3001/api/settings/twilio-status")).json();
        if (td.success && td.data.active) setTwilioActive(true);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.email.split("@")[0], email: form.email, password: form.password, role: "CUSTOMER" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || "Registration failed"); return; }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/user/dashboard");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!googleActive || !googleClientId) { setError("Google sign-up is not available"); return; }
    try {
      const ga = (window as any).google?.accounts;
      if (!ga) { setError("Google SDK not loaded"); return; }
      ga.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          try {
            const p = JSON.parse(atob(response.credential.split(".")[1]));
            const res = await fetch("http://localhost:3001/api/auth/google", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: p.email, name: p.name, googleId: p.sub }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("user", JSON.stringify(data.data.user));
            router.push("/user/dashboard");
          } catch { setError("Google auth failed"); }
        },
      });
      ga.id.prompt();
    } catch { setError("Google error"); }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    if (!phone || phone.length < 10) { setError("Enter a valid phone number"); return; }
    setOtpLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/otp/send", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setOtpSent(true);
      if (data.data?.otp) setDevOtp(data.data.otp);
    } catch { setError("Network error"); } finally { setOtpLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    setOtpLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/user/dashboard");
    } catch { setError("Network error"); } finally { setOtpLoading(false); }
  };

  const ic = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {googleActive && googleClientId && <script src="https://accounts.google.com/gsi/client" async defer />}
      <div className="w-full max-w-[420px]">
        <Link href="/login/user" className="inline-flex items-center text-blue-300 text-sm mb-5 hover:underline">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Login
        </Link>

        <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-7 shadow-2xl shadow-blue-900/20 border border-white/10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 shadow-lg shadow-blue-600/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-white">Create Account</h1>
            <p className="text-blue-300/60 text-xs mt-1">Join us and book your perfect hostel room</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="Email Address *" className={ic + " pl-10"} />
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">🔒 Set Password</p>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input type={showPw1 ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required placeholder="Password (min 6 chars) *" className={ic + " pl-10 pr-10"} />
                <button type="button" onClick={() => setShowPw1(!showPw1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw1 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <input type={showPw2 ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required placeholder="Confirm Password *" className={ic + " pl-10 pr-10"} />
                <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw2 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all text-sm">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {(googleActive || twilioActive) && (
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">or sign up with</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          )}

          {(googleActive || twilioActive) && (
            <div className="space-y-3">
              {googleActive && (
                <button onClick={handleGoogle} className="w-full py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all text-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign up with Google
                </button>
              )}

              {twilioActive && (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 9876543210" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all" />
                      </div>
                      <button type="submit" disabled={otpLoading} className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all shrink-0">
                        {otpLoading ? "..." : "Send OTP"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-2.5">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                        <p className="text-emerald-300 text-xs">
                          OTP sent to <span className="font-bold">{phone}</span>
                          {devOtp && <span className="block mt-0.5 text-[11px] text-white/50">Dev OTP: <span className="font-bold text-yellow-300">{devOtp}</span></span>}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="• • • • • •" maxLength={6}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                        <button type="submit" disabled={otpLoading} className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all shrink-0">
                          {otpLoading ? "..." : "Verify"}
                        </button>
                      </div>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setDevOtp(""); }} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-1">← Change phone number</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login/user" className="text-blue-400 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
