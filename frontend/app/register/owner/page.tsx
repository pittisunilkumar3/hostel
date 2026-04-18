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
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required placeholder="Password (min 6 chars) *" className={inputClass} />
              <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required placeholder="Confirm Password *" className={inputClass} />
              <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="accent-emerald-500" />
                Show passwords
              </label>
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
