"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EnhancedUserLogin() {
  const [tab, setTab] = useState<"email" | "google" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [googleActive, setGoogleActive] = useState(false);
  const [twilioActive, setTwilioActive] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if Google & Twilio are active
    const checkStatus = async () => {
      try {
        const gRes = await fetch("http://localhost:3001/api/settings/google-status");
        const gData = await gRes.json();
        if (gData.success && gData.data.active) {
          setGoogleActive(true);
          setGoogleClientId(gData.data.clientId);
        }

        const tRes = await fetch("http://localhost:3001/api/settings/twilio-status");
        const tData = await tRes.json();
        if (tData.success && tData.data.active) {
          setTwilioActive(true);
        }
      } catch (e) { console.error(e); }
    };
    checkStatus();
  }, []);

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/login/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || "Login failed"); return; }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/user/dashboard");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  // Google login
  const handleGoogleLogin = async () => {
    if (!googleActive || !googleClientId) {
      setError("Google login is not configured by admin");
      return;
    }

    try {
      // Use Google Identity Services
      const googleAccounts = (window as any).google?.accounts;
      if (!googleAccounts) {
        setError("Google SDK not loaded. Please refresh the page.");
        return;
      }

      googleAccounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          try {
            // Decode JWT to get user info
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            const res = await fetch("http://localhost:3001/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: payload.email,
                name: payload.name,
                googleId: payload.sub,
              }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("user", JSON.stringify(data.data.user));
            router.push("/user/dashboard");
          } catch (err: any) { setError("Google auth failed"); }
        },
      });
      googleAccounts.id.prompt();
    } catch { setError("Google login error"); }
  };

  // Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setOtpSent(true);
      if (data.data?.otp) setDevOtp(data.data.otp);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/user/dashboard");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Load Google SDK if active */}
      {googleActive && googleClientId && (
        <script src={`https://accounts.google.com/gsi/client`} async defer />
      )}

      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-blue-300 text-sm mb-6 hover:underline">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-blue-900/30">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/30 rounded-xl mb-6">
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Customer Login</h1>
          <p className="text-blue-300 text-sm mb-6">Choose your preferred login method</p>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-6">
            <button onClick={() => { setTab("email"); setError(""); }} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${tab === "email" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              ✉️ Email
            </button>
            {googleActive && (
              <button onClick={() => { setTab("google"); setError(""); }} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${tab === "google" ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"}`}>
                🔑 Google
              </button>
            )}
            {twilioActive && (
              <button onClick={() => { setTab("otp"); setError(""); }} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${tab === "otp" ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-white"}`}>
                📱 OTP
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5 text-red-300 text-sm">{error}</div>
          )}

          {/* Email Tab */}
          {tab === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Google Tab */}
          {tab === "google" && googleActive && (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm mb-6">Sign in with your Google account</p>
              <button onClick={handleGoogleLogin} className="w-full py-3 px-4 bg-white text-gray-800 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}

          {/* OTP Tab */}
          {tab === "otp" && twilioActive && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 9876543210"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 text-sm text-center">
                    OTP sent to {phone}
                    {devOtp && <span className="block mt-1 font-bold text-white">Dev OTP: {devOtp}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Enter OTP</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="6-digit OTP" maxLength={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-[1em] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setDevOtp(""); }} className="w-full text-sm text-gray-400 hover:text-white">
                    ← Change phone number
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 Hostel Management System
        </p>
      </div>
    </div>
  );
}
