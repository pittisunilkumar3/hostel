"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/auth";
import LoginForm from "@/app/components/LoginForm";
import EnhancedUserLogin from "@/app/components/EnhancedUserLogin";

type LoginType = "admin" | "owner" | "customer" | null;

export default function DynamicLoginPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loginType, setLoginType] = useState<LoginType>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolveLoginType = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/login-url-public`);
        const data = await res.json();

        if (data.success && data.data) {
          const d = data.data;
          if (slug === d.admin_login_url) { setLoginType("admin"); }
          else if (slug === d.owner_login_url) { setLoginType("owner"); }
          else if (slug === d.customer_login_url) { setLoginType("customer"); }
          else { setNotFound(true); }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) resolveLoginType();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Login Page Not Found</h1>
          <p className="text-gray-400 mb-8">The login page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
          <a
            href="/"
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (loginType === "admin") {
    return (
      <LoginForm
        role="SUPER_ADMIN"
        title="Super Admin Login"
        subtitle="Full system access to manage everything"
        gradient="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        accentColor="text-purple-300"
        bgColor="bg-slate-800/80"
        iconBg="bg-purple-500/30"
        btnColor="bg-purple-600"
        btnHover="hover:bg-purple-700"
        btnGradient="bg-gradient-to-r from-purple-600 to-violet-600"
        shadowColor="shadow-purple-900/30"
        backLink="/"
        backLabel="Back to Home"
        dashboardPath="/admin/dashboard"
        icon={
          <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
      />
    );
  }

  if (loginType === "owner") {
    return (
      <LoginForm
        role="OWNER"
        title="Hostel Owner Login"
        subtitle="Manage your hostel, rooms & bookings"
        gradient="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
        accentColor="text-emerald-300"
        bgColor="bg-slate-800/80"
        iconBg="bg-emerald-500/30"
        btnColor="bg-emerald-600"
        btnHover="hover:bg-emerald-700"
        btnGradient="bg-gradient-to-r from-emerald-600 to-teal-600"
        shadowColor="shadow-emerald-900/30"
        otpAccent="emerald"
        backLink="/"
        backLabel="Back to Home"
        dashboardPath="/owner/dashboard"
        registerPath="/register/owner"
        registerLabel="Register as Owner"
        icon={
          <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
      />
    );
  }

  if (loginType === "customer") {
    return <EnhancedUserLogin />;
  }

  return null;
}
