"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
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
          role: "CUSTOMER",
          phone: form.phone,
          address: form.address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Registration failed");
        return;
      }
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/user/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login/user" className="inline-flex items-center text-blue-300 text-sm mb-5 hover:underline">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
        </Link>

        <div className="bg-slate-800/80 rounded-2xl p-7 shadow-2xl shadow-blue-900/30 border border-blue-500/10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/20 rounded-2xl mb-3">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Create Customer Account</h1>
            <p className="text-blue-300/60 text-xs mt-1">Find and book hostel rooms easily</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Personal Info */}
            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">👤 Personal Information</p>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Full Name *" className={inputClass} />
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="Email Address *" className={inputClass} />
              <div className="flex gap-2">
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone Number" className={inputClass} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">📍 Address</p>
              <textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Your Address" rows={2} className={inputClass + " resize-none"} />
            </div>

            {/* Password */}
            <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">🔒 Set Password</p>
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required placeholder="Password (min 6 chars) *" className={inputClass} />
              <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required placeholder="Confirm Password *" className={inputClass} />
              <label className="flex items-center gap-2 text-gray-400 text-xs cursor-pointer">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="accent-blue-500" />
                Show passwords
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all text-sm"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login/user" className="text-blue-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
