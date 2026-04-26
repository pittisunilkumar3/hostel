"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/lib/siteSettings";
import { useLoginSetup } from "@/lib/loginSetup";

interface LoginFormProps {
  role: "SUPER_ADMIN" | "OWNER" | "CUSTOMER";
  title: string;
  subtitle: string;
  gradient: string;
  accentColor: string;
  bgColor: string;
  iconBg: string;
  icon: React.ReactNode;
  btnColor: string;
  btnHover: string;
  shadowColor: string;
  backLink: string;
  backLabel: string;
  dashboardPath: string;
  registerPath?: string;
  registerLabel?: string;
  btnGradient?: string;
  otpAccent?: string;
}

export default function LoginForm({
  role,
  title,
  subtitle,
  gradient,
  accentColor,
  bgColor,
  iconBg,
  icon,
  btnColor,
  btnHover,
  shadowColor,
  backLink,
  backLabel,
  dashboardPath,
  registerPath,
  registerLabel,
  btnGradient,
  otpAccent,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const copyright = site.copyrightText || `© ${new Date().getFullYear()} ${name}`;

  // Social login states (only for non-admin)
  const [googleActive, setGoogleActive] = useState(false);
  const [facebookActive, setFacebookActive] = useState(false);
  const [appleActive, setAppleActive] = useState(false);
  const [twilioActive, setTwilioActive] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const showSocial = role !== "SUPER_ADMIN";
  const loginSetup = useLoginSetup();
  const otpColor = otpAccent || "emerald";
  const anySocial = showSocial && loginSetup.socialLogin && ((loginSetup.googleLogin && googleActive) || (loginSetup.facebookLogin && facebookActive) || (loginSetup.appleLogin && appleActive));
  const anyAlt = anySocial || (showSocial && loginSetup.otpLogin && twilioActive);

  useEffect(() => {
    if (!showSocial) return;
    (async () => {
      try {
        const gRes = await fetch("http://localhost:3001/api/settings/google-status");
        const gData = await gRes.json();
        if (gData.success && gData.data.active) {
          setGoogleActive(true);
          setGoogleClientId(gData.data.clientId);
        }
        const tRes = await fetch("http://localhost:3001/api/settings/twilio-status");
        const tData = await tRes.json();
        if (tData.success && tData.data.active) setTwilioActive(true);
        const fbRes = await fetch("http://localhost:3001/api/settings/facebook-status");
        const fbData = await fbRes.json();
        if (fbData.success && fbData.data.active) setFacebookActive(true);
        const apRes = await fetch("http://localhost:3001/api/settings/apple-status");
        const apData = await apRes.json();
        if (apData.success && apData.data.active) setAppleActive(true);
      } catch (e) { console.error(e); }
    })();
  }, [showSocial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const rolePath = role === "SUPER_ADMIN" ? "admin" : role === "OWNER" ? "owner" : "user";
      const res = await fetch(`http://localhost:3001/api/auth/login/${rolePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || "Login failed"); return; }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push(dashboardPath);
    } catch { setError("Network error. Check if backend is running."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!loginSetup.socialLogin || !loginSetup.googleLogin || !googleActive || !googleClientId) { setError("Google login not available"); return; }
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
            router.push(dashboardPath);
          } catch { setError("Google auth failed"); }
        },
      });
      ga.id.prompt();
    } catch { setError("Google error"); }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) { setError("Enter a valid phone number"); return; }
    setOtpLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/otp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setOtpSent(true);
      if (data.data?.otp) setDevOtp(data.data.otp);
    } catch { setError("Network error"); }
    finally { setOtpLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push(dashboardPath);
    } catch { setError("Network error"); }
    finally { setOtpLoading(false); }
  };

  const inputBase = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div className={`min-h-screen ${gradient} flex items-center justify-center p-4`}>
      {showSocial && loginSetup.socialLogin && loginSetup.googleLogin && googleActive && googleClientId && <script src="https://accounts.google.com/gsi/client" async defer />}
      <div className="w-full max-w-md">
        <Link href={backLink} className={`inline-flex items-center ${accentColor} text-sm mb-6 hover:underline`}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {backLabel}
        </Link>

        <div className={`${bgColor} rounded-2xl p-8 shadow-2xl ${shadowColor}`}>
          <div className={`inline-flex items-center justify-center w-16 h-16 ${iconBg} rounded-xl mb-6`}>
            {site.companyLogo ? (
              <img src={site.companyLogo} alt={name} className="w-10 h-10 rounded-lg object-contain" />
            ) : icon}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className={`${accentColor} text-sm mb-8`}>{subtitle}</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 text-red-300 text-sm">{error}</div>
          )}

          {/* Email + Password Form */}
          {(loginSetup.manualLogin || !showSocial) && <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" className={inputBase + " pr-12"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-400 cursor-pointer"><input type="checkbox" className="mr-2 rounded accent-blue-500" />Remember me</label>
              <a href="#" className={`${accentColor} hover:underline`}>Forgot password?</a>
            </div>
            <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-semibold text-white ${btnGradient || btnColor} ${!btnGradient ? btnHover : ""} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}>
              {loading ? (<><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Signing in...</>) : "Sign In"}
            </button>
          </form>}

          {/* Google + OTP (only for non-admin) */}
          {loginSetup.manualLogin && anyAlt && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>
              <div className="space-y-3">
                {showSocial && loginSetup.socialLogin && loginSetup.googleLogin && googleActive && (
                  <button onClick={handleGoogle} className="w-full py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all text-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                )}
                {/* Facebook Button */}
                {showSocial && loginSetup.socialLogin && loginSetup.facebookLogin && facebookActive && (
                  <button className="w-full py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all text-sm">
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Continue with Facebook
                  </button>
                )}
                {/* Apple Button */}
                {showSocial && loginSetup.socialLogin && loginSetup.appleLogin && appleActive && (
                  <button className="w-full py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all text-sm">
                    <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    Continue with Apple
                  </button>
                )}
                {showSocial && loginSetup.otpLogin && twilioActive && (
                  <div>
                    {!otpSent ? (
                      <form onSubmit={handleSendOTP} className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          </div>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 9876543210" className={`w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${otpColor}-500/50 text-sm transition-all`} />
                        </div>
                        <button type="submit" disabled={otpLoading} className={`px-5 py-3 bg-gradient-to-r from-${otpColor}-600 to-${otpColor}-600 text-white rounded-xl font-semibold text-sm shadow-lg disabled:opacity-50 transition-all shrink-0`}>
                          {otpLoading ? "..." : "Send OTP"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOTP} className="space-y-3">
                        <div className={`bg-${otpColor}-500/10 border border-${otpColor}-500/20 rounded-xl p-2.5 text-center`}>
                          <p className={`text-${otpColor}-300 text-xs`}>
                            OTP sent to <span className="font-bold">{phone}</span>
                            {devOtp && <span className="block mt-0.5 text-[11px] text-white/50">Dev OTP: <span className="font-bold text-yellow-300">{devOtp}</span></span>}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="• • • • • •" maxLength={6} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                          <button type="submit" disabled={otpLoading} className={`px-5 py-3 bg-gradient-to-r from-${otpColor}-600 to-${otpColor}-600 text-white rounded-xl font-semibold text-sm shadow-lg disabled:opacity-50 transition-all shrink-0`}>
                            {otpLoading ? "..." : "Verify"}
                          </button>
                        </div>
                        <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setDevOtp(""); }} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-1">← Change phone number</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {registerPath && (
          <p className="text-center text-gray-400 text-sm mt-5">
            Don&apos;t have an account?{" "}
            <Link href={registerPath} className={`${accentColor} font-semibold hover:underline`}>{registerLabel || "Register"}</Link>
          </p>
        )}
        <p className="text-center text-gray-500 text-sm mt-3">{copyright}</p>
      </div>
    </div>
  );
}
