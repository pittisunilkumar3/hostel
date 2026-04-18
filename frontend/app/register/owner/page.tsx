"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OwnerRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    hostelName: "",
    hostelAddress: "",
    idProof: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: "OWNER",
          phone: form.phone,
          hostel_name: form.hostelName,
          hostel_address: form.hostelAddress,
          id_proof: form.idProof,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Registration failed");
        return;
      }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/owner/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login/owner" className="inline-flex items-center text-emerald-300 text-sm mb-5 hover:underline">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
        </Link>

        <div className="bg-slate-800/80 rounded-2xl p-7 shadow-2xl shadow-emerald-900/30 border border-emerald-500/10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-2xl mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Register as Hostel Owner</h1>
            <p className="text-emerald-300/60 text-xs mt-1">List your hostel and start managing bookings</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Personal Info */}
            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">👤 Personal Information</p>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Full Name *" className={inputClass} />
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="Email Address *" className={inputClass} />
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone Number" className={inputClass} />
            </div>

            {/* Password */}
            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">🔒 Set Password</p>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required placeholder="Password (min 6 chars) *" className={inputClass + " pl-10 pr-11"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required placeholder="Confirm Password *" className={inputClass + " pl-10 pr-11"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Hostel Info */}
            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">🏠 Hostel Details</p>
              <input type="text" value={form.hostelName} onChange={(e) => update("hostelName", e.target.value)} required placeholder="Hostel Name *" className={inputClass} />
              <textarea value={form.hostelAddress} onChange={(e) => update("hostelAddress", e.target.value)} required placeholder="Hostel Full Address *" rows={2} className={inputClass + " resize-none"} />
              <input type="text" value={form.idProof} onChange={(e) => update("idProof", e.target.value)} placeholder="ID Proof Number (Aadhar/PAN)" className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all text-sm"
            >
              {loading ? "Creating Account..." : "Create Owner Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login/owner" className="text-emerald-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
