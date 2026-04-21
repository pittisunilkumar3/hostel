"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

type Tab = "customer-login" | "login-url";

interface LoginSetupData {
  manual_login_status: number;
  otp_login_status: number;
  social_login_status: number;
  google_login_status: number;
  facebook_login_status: number;
  apple_login_status: number;
  email_verification_status: number;
  phone_verification_status: number;
}

interface LoginUrlData {
  admin_login_url: string;
  owner_login_url: string;
  user_login_url: string;
}

export default function LoginSetupPage() {
  const [tab, setTab] = useState<Tab>("customer-login");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);

  // Login setup state
  const [setup, setSetup] = useState<LoginSetupData>({
    manual_login_status: 1,
    otp_login_status: 0,
    social_login_status: 0,
    google_login_status: 0,
    facebook_login_status: 0,
    apple_login_status: 0,
    email_verification_status: 0,
    phone_verification_status: 0,
  });

  // Login URL state
  const [loginUrls, setLoginUrls] = useState<LoginUrlData>({
    admin_login_url: "admin",
    owner_login_url: "owner",
    user_login_url: "user",
  });
  const [originalUrls, setOriginalUrls] = useState<LoginUrlData>({ ...loginUrls });

  useEffect(() => {
    setUser(getCurrentUser());
    Promise.all([fetchLoginSetup(), fetchLoginUrls()]);
  }, []);

  const fetchLoginSetup = async () => {
    try {
      const res = await apiFetch("/api/settings/login-setup");
      if (res.success && res.data) {
        setSetup(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoginUrls = async () => {
    try {
      const res = await apiFetch("/api/settings/login-urls");
      if (res.success && res.data) {
        setLoginUrls(res.data);
        setOriginalUrls(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const msg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };
  const clearMsg = () => setMessage(null);

  // ---- Login Setup Handlers ----
  const toggleSetup = (key: keyof LoginSetupData) => {
    setSetup(prev => ({ ...prev, [key]: prev[key] ? 0 : 1 }));
  };

  const saveLoginSetup = async () => {
    setSaving(true);
    clearMsg();

    // Client-side validation
    if (!setup.manual_login_status && !setup.otp_login_status && !setup.social_login_status) {
      msg("error", "At least one login method must remain active (Manual, OTP, or Social Login).");
      setSaving(false);
      return;
    }

    if (setup.social_login_status && !setup.google_login_status && !setup.facebook_login_status && !setup.apple_login_status) {
      msg("error", "At least one social login provider must be selected (Google, Facebook, or Apple).");
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch("/api/settings/login-setup", {
        method: "PUT",
        body: JSON.stringify(setup),
      });
      if (res.success) {
        msg("success", "✅ Login setup updated successfully!");
        setSetup(res.data);
      } else {
        msg("error", res.message || "Failed to update login setup");
      }
    } catch {
      msg("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Login URL Handlers ----
  const saveLoginUrl = async (type: string, key: keyof LoginUrlData) => {
    setSaving(true);
    clearMsg();

    if (!loginUrls[key] || !/^[a-zA-Z0-9\-_]+$/.test(loginUrls[key])) {
      msg("error", "Login URL must only contain letters, numbers, hyphens, and underscores.");
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch("/api/settings/login-urls", {
        method: "PUT",
        body: JSON.stringify({ type, [key]: loginUrls[key] }),
      });
      if (res.success) {
        msg("success", `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} login URL updated successfully!`);
        setLoginUrls(res.data);
        setOriginalUrls(res.data);
      } else {
        msg("error", res.message || "Failed to update login URL");
      }
    } catch {
      msg("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // ---- Shared Components ----
  const Toggle = ({ checked, onChange, disabled = false, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; size?: "sm" | "md" }) => (
    <label className="flex flex-col items-end gap-1 cursor-pointer shrink-0">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
        <div className={`${size === "sm" ? "w-10 h-5" : "w-12 h-6"} rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300"} ${disabled ? "opacity-50" : ""}`} />
        <div className={`absolute top-0.5 left-0.5 ${size === "sm" ? "w-4 h-4" : "w-5 h-5"} bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-6" : ""}`} style={size === "sm" ? { transform: checked ? "translateX(20px)" : "translateX(0)" } : undefined} />
      </div>
      <span className="text-[10px] text-gray-400 uppercase">{checked ? "ON" : "OFF"}</span>
    </label>
  );

  const InfoIcon = ({ text }: { text: string }) => (
    <span className="relative group inline-block ml-1">
      <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap max-w-xs z-50 shadow-xl">{text}</span>
    </span>
  );

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading login setup...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Login Setup</h1>
            <p className="text-gray-500 text-sm">Configure customer login methods and panel login URLs</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab("customer-login"); clearMsg(); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            tab === "customer-login"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Customer Login
        </button>
        <button
          onClick={() => { setTab("login-url"); clearMsg(); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            tab === "login-url"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          Panel Login Page URL
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {message.text}
          <button onClick={clearMsg} className="ml-auto text-current opacity-50 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ===================== TAB 1: CUSTOMER LOGIN ===================== */}
      {tab === "customer-login" && (
        <div className="max-w-3xl space-y-6">
          {/* Setup Login Option Card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Setup Login Option</h3>
                  <p className="text-xs text-gray-500">The option you select, customers will have the option to login with that method</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Manual Login */}
              <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Manual Login
                      <InfoIcon text="By enabling manual login, customers will get the option to create an account and log in using email & password" />
                    </p>
                    <p className="text-xs text-gray-400">Email & Password authentication</p>
                  </div>
                </div>
                <Toggle checked={!!setup.manual_login_status} onChange={() => toggleSetup("manual_login_status")} />
              </label>

              {/* OTP Login */}
              <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      OTP Login
                      <InfoIcon text="With OTP Login, customers can log in using their phone number with an OTP verification" />
                    </p>
                    <p className="text-xs text-gray-400">Phone number + OTP verification</p>
                  </div>
                </div>
                <Toggle checked={!!setup.otp_login_status} onChange={() => toggleSetup("otp_login_status")} />
              </label>

              {/* Social Login */}
              <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Social Media Login
                      <InfoIcon text="With Social Login, customers can log in using social media credentials (Google, Facebook, Apple)" />
                    </p>
                    <p className="text-xs text-gray-400">Google, Facebook & Apple login</p>
                  </div>
                </div>
                <Toggle checked={!!setup.social_login_status} onChange={() => toggleSetup("social_login_status")} />
              </label>
            </div>
          </div>

          {/* Social Media Sub-Options */}
          {setup.social_login_status ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Social Media Login Setup</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Choose which social login providers to enable</p>
                  </div>
                  <a href="/admin/settings" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold underline">
                    Configure Social Login API Keys →
                  </a>
                </div>
              </div>
              <div className="p-5 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Choose social media</h4>
                <div className="space-y-2">
                  {/* Google */}
                  <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-lg font-bold text-blue-600">G</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Google
                          <InfoIcon text="Enabling Google Login, customers can log in using their existing Gmail credentials" />
                        </p>
                      </div>
                    </div>
                    <Toggle checked={!!setup.google_login_status} onChange={() => toggleSetup("google_login_status")} size="sm" />
                  </label>

                  {/* Facebook */}
                  <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-lg font-bold text-blue-800">f</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Facebook
                          <InfoIcon text="Enabling Facebook Login, customers can log in using their existing Facebook credentials" />
                        </p>
                      </div>
                    </div>
                    <Toggle checked={!!setup.facebook_login_status} onChange={() => toggleSetup("facebook_login_status")} size="sm" />
                  </label>

                  {/* Apple */}
                  <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg font-bold text-gray-800"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Apple
                          <InfoIcon text="Enabling Apple Login, customers can log in using their Apple ID (Apple devices only)" />
                        </p>
                      </div>
                    </div>
                    <Toggle checked={!!setup.apple_login_status} onChange={() => toggleSetup("apple_login_status")} size="sm" />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {/* Verification Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-900">Verification</h3>
              <p className="text-xs text-gray-500 mt-0.5">The options you select will require verification by the customer during registration</p>
            </div>
            <div className="p-5 bg-gray-50/50">
              <div className="space-y-2">
                {/* Email Verification */}
                <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Email Verification
                        <InfoIcon text="If Email verification is on, customers must verify their email address with an OTP to complete signup" />
                      </p>
                    </div>
                  </div>
                  <Toggle checked={!!setup.email_verification_status} onChange={() => toggleSetup("email_verification_status")} size="sm" />
                </label>

                {/* Phone Verification */}
                <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Phone Number Verification
                        <InfoIcon text="If Phone verification is on, customers must verify their phone number with an OTP to complete signup" />
                      </p>
                    </div>
                  </div>
                  <Toggle checked={!!setup.phone_verification_status} onChange={() => toggleSetup("phone_verification_status")} size="sm" />
                </label>
              </div>
            </div>
          </div>

          {/* Active Methods Summary */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-sm font-medium text-indigo-800">Active Login Methods</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {setup.manual_login_status ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Manual Login
                    </span>
                  ) : null}
                  {setup.otp_login_status ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      OTP Login
                    </span>
                  ) : null}
                  {setup.social_login_status ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Social Login
                    </span>
                  ) : null}
                  {!setup.manual_login_status && !setup.otp_login_status && !setup.social_login_status ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">⚠ No method active</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveLoginSetup}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save Login Setup
                </>
              )}
            </button>
            <button
              onClick={() => { fetchLoginSetup(); clearMsg(); }}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: LOGIN PAGE URL ===================== */}
      {tab === "login-url" && (
        <div className="max-w-3xl space-y-6">
          {/* Info Banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-sm font-medium text-indigo-800">Custom Login URLs</p>
              <p className="text-xs text-indigo-600 mt-0.5">Set custom, secure login URLs for each panel. Only letters, numbers, hyphens, and underscores are allowed. Each URL must be unique.</p>
            </div>
          </div>

          {/* Admin Login URL */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Super Admin Login URL</h3>
                  <p className="text-xs text-gray-500">Add dynamic secure login URL for Super Admin panel</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Login URL <InfoIcon text="This will be the URL path used to access the admin login page" /></label>
              <div className="flex items-center">
                <div className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-mono whitespace-nowrap">
                  {baseUrl}/login/
                </div>
                <input
                  type="text"
                  value={loginUrls.admin_login_url}
                  onChange={e => setLoginUrls(prev => ({ ...prev, admin_login_url: e.target.value.replace(/[^a-zA-Z0-9\-_]/g, "") }))}
                  placeholder="admin"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Current URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{baseUrl}/login/{loginUrls.admin_login_url}</code></p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => saveLoginUrl("admin", "admin_login_url")}
                  disabled={saving || loginUrls.admin_login_url === originalUrls.admin_login_url}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    loginUrls.admin_login_url !== originalUrls.admin_login_url
                      ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  Submit
                </button>
                {loginUrls.admin_login_url !== originalUrls.admin_login_url && (
                  <span className="text-xs text-amber-600 font-medium">⚠ Unsaved changes</span>
                )}
              </div>
            </div>
          </div>

          {/* Owner Login URL */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Owner Login URL</h3>
                  <p className="text-xs text-gray-500">Add dynamic secure login URL for Hostel Owner panel</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Login URL <InfoIcon text="This will be the URL path used to access the owner login page" /></label>
              <div className="flex items-center">
                <div className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-mono whitespace-nowrap">
                  {baseUrl}/login/
                </div>
                <input
                  type="text"
                  value={loginUrls.owner_login_url}
                  onChange={e => setLoginUrls(prev => ({ ...prev, owner_login_url: e.target.value.replace(/[^a-zA-Z0-9\-_]/g, "") }))}
                  placeholder="owner"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Current URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{baseUrl}/login/{loginUrls.owner_login_url}</code></p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => saveLoginUrl("owner", "owner_login_url")}
                  disabled={saving || loginUrls.owner_login_url === originalUrls.owner_login_url}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    loginUrls.owner_login_url !== originalUrls.owner_login_url
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  Submit
                </button>
                {loginUrls.owner_login_url !== originalUrls.owner_login_url && (
                  <span className="text-xs text-amber-600 font-medium">⚠ Unsaved changes</span>
                )}
              </div>
            </div>
          </div>

          {/* User/Customer Login URL */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Customer Login URL</h3>
                  <p className="text-xs text-gray-500">Add dynamic secure login URL for Customer/User panel</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Login URL <InfoIcon text="This will be the URL path used to access the customer login page" /></label>
              <div className="flex items-center">
                <div className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-mono whitespace-nowrap">
                  {baseUrl}/login/
                </div>
                <input
                  type="text"
                  value={loginUrls.user_login_url}
                  onChange={e => setLoginUrls(prev => ({ ...prev, user_login_url: e.target.value.replace(/[^a-zA-Z0-9\-_]/g, "") }))}
                  placeholder="user"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Current URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{baseUrl}/login/{loginUrls.user_login_url}</code></p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => saveLoginUrl("user", "user_login_url")}
                  disabled={saving || loginUrls.user_login_url === originalUrls.user_login_url}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    loginUrls.user_login_url !== originalUrls.user_login_url
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  Submit
                </button>
                {loginUrls.user_login_url !== originalUrls.user_login_url && (
                  <span className="text-xs text-amber-600 font-medium">⚠ Unsaved changes</span>
                )}
              </div>
            </div>
          </div>

          {/* How it works info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-sm font-medium text-indigo-800">How it works</p>
              <p className="text-xs text-indigo-600 mt-1">Custom login URLs provide an extra layer of security by hiding the default login page paths. Only users who know the custom URL can access the login page. Each URL must be unique across all panels.</p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
