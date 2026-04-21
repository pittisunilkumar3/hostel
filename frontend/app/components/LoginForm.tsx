"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/lib/siteSettings";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiBase = "http://localhost:3001";
      const rolePath = role === "SUPER_ADMIN" ? "admin" : role === "OWNER" ? "owner" : "user";

      const res = await fetch(`${apiBase}/api/auth/login/${rolePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || `Login failed (${res.status})`);
        return;
      }

      // Store token and user info
      const { token, user } = data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to dashboard
      router.push(dashboardPath);
    } catch (err: any) {
      setError("Network error. Please check if the backend server is running on port 3001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${gradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href={backLink}
          className={`inline-flex items-center ${accentColor} text-sm mb-6 hover:underline`}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>

        {/* Card */}
        <div className={`${bgColor} rounded-2xl p-8 shadow-2xl ${shadowColor}`}>
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 ${iconBg} rounded-xl mb-6`}>
            {site.companyLogo ? (
              <img src={site.companyLogo} alt={name} className="w-10 h-10 rounded-lg object-contain" />
            ) : (
              icon
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className={`${accentColor} text-sm mb-8`}>{subtitle}</p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-400 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded accent-blue-500" />
                Remember me
              </label>
              <a href="#" className={`${accentColor} hover:underline`}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white ${btnColor} ${btnHover} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {registerPath && (
          <p className="text-center text-gray-400 text-sm mt-5">
            Don't have an account?{" "}
            <Link href={registerPath} className={`${accentColor} font-semibold hover:underline`}>
              {registerLabel || "Register"}
            </Link>
          </p>
        )}

        <p className="text-center text-gray-500 text-sm mt-3">
          {copyright}
        </p>
      </div>
    </div>
  );
}
