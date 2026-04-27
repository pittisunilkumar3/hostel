"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

type Tab = "customer" | "panel_url";

export default function LoginSetupPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("customer");

  // Customer Login Setup
  const [manualLogin, setManualLogin] = useState(true);
  const [otpLogin, setOtpLogin] = useState(false);
  const [socialLogin, setSocialLogin] = useState(false);
  const [googleLogin, setGoogleLogin] = useState(false);
  const [facebookLogin, setFacebookLogin] = useState(false);
  const [appleLogin, setAppleLogin] = useState(false);
  const [emailVerification, setEmailVerification] = useState(false);
  const [phoneVerification, setPhoneVerification] = useState(false);
  const [firebaseOtpEnabled, setFirebaseOtpEnabled] = useState(false);

  // Social provider active status
  const [googleActive, setGoogleActive] = useState(false);
  const [facebookActive, setFacebookActive] = useState(false);
  const [appleActive, setAppleActive] = useState(false);

  // Panel Login URLs
  const [adminLoginUrl, setAdminLoginUrl] = useState("admin");
  const [ownerLoginUrl, setOwnerLoginUrl] = useState("owner");
  const [customerLoginUrl, setCustomerLoginUrl] = useState("user");

  useEffect(() => { setUser(getCurrentUser()); Promise.all([fetchLoginSetup(), fetchSocialStatus(), fetchLoginUrls()]); }, []);

  const fetchLoginSetup = async () => {
    try {
      const res = await apiFetch("/api/settings/login-setup");
      if (res.success && res.data) {
        const d = res.data;
        setManualLogin(!!d.manual_login_status);
        setOtpLogin(!!d.otp_login_status);
        setSocialLogin(!!d.social_login_status);
        setGoogleLogin(!!d.google_login_status);
        setFacebookLogin(!!d.facebook_login_status);
        setAppleLogin(!!d.apple_login_status);
        setEmailVerification(!!d.email_verification_status);
        setPhoneVerification(!!d.phone_verification_status);
        setFirebaseOtpEnabled(!!d._firebase_otp_enabled);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSocialStatus = async () => {
    try {
      const res = await apiFetch("/api/settings");
      if (res.success) {
        res.data.forEach((s: any) => {
          const k = s.setting_key, v = s.setting_value;
          if (k === "google_is_active") setGoogleActive(v === "1");
          if (k === "facebook_is_active") setFacebookActive(v === "1");
          if (k === "apple_is_active") setAppleActive(v === "1");
        });
      }
    } catch (e) { console.error(e); }
  };

  const fetchLoginUrls = async () => {
    try {
      const res = await apiFetch("/api/settings/login-url");
      if (res.success && res.data) {
        if (res.data.admin_login_url) setAdminLoginUrl(res.data.admin_login_url);
        if (res.data.owner_login_url) setOwnerLoginUrl(res.data.owner_login_url);
        if (res.data.customer_login_url) setCustomerLoginUrl(res.data.customer_login_url);
      }
    } catch (e) { console.error(e); }
  };

  const msg = (type: "success" | "error", text: string) => setMessage({ type, text });
  const clearMsg = () => setMessage(null);

  const saveLoginSetup = async () => {
    setSaving(-4); clearMsg();
    try {
      const res = await apiFetch("/api/settings/login-setup", {
        method: "PUT",
        body: JSON.stringify({
          manual_login_status: manualLogin,
          otp_login_status: otpLogin,
          social_login_status: socialLogin,
          google_login_status: googleLogin,
          facebook_login_status: facebookLogin,
          apple_login_status: appleLogin,
          email_verification_status: emailVerification,
          phone_verification_status: phoneVerification,
        }),
      });
      res.success ? (msg("success", "✅ Login setup saved!"), fetchLoginSetup(), localStorage.removeItem("loginSetup"), window.dispatchEvent(new Event("login-setup-changed"))) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };

  const saveLoginUrl = async (type: string, value: string) => {
    setSaving(-50); clearMsg();
    try {
      const res = await apiFetch("/api/settings/login-url", {
        method: "PUT",
        body: JSON.stringify({ type, value }),
      });
      res.success ? (msg("success", `✅ ${type.replace(/_/g, " ")} login URL updated!`), fetchLoginUrls()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const tabs: { key: Tab; label: string }[] = [
    { key: "customer", label: "Customer Login" },
    { key: "panel_url", label: "Panel Login Page URL" },
  ];

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Login Setup</h1>
        <p className="text-gray-500 mt-1">Configure login methods and panel login page URLs</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); clearMsg(); }} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {loading ? <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><p className="text-gray-400">Loading...</p></div> : <>

      {/* ===================== CUSTOMER LOGIN TAB ===================== */}
      {tab === "customer" && <div className="max-w-3xl space-y-6">
        {/* Setup Login Option */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Setup Login Option</h3>
            <p className="text-xs text-gray-500 mt-0.5">The option you select, customer will have the option to login with.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Manual Login */}
              <label className={"cursor-pointer rounded-xl border-2 p-4 transition-all " + (manualLogin ? "border-blue-400 bg-blue-50/50" : "border-gray-200 hover:border-gray-300")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (manualLogin ? "bg-blue-100" : "bg-gray-100")}>
                      <svg className={"w-4 h-4 " + (manualLogin ? "text-blue-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Manual Login</span>
                  </div>
                  <input type="checkbox" checked={manualLogin} onChange={(e) => setManualLogin(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">By enabling manual login, customers will get the option to create an account and log in using email &amp; password.</p>
              </label>

              {/* OTP Login */}
              <label className={"cursor-pointer rounded-xl border-2 p-4 transition-all " + (otpLogin ? "border-emerald-400 bg-emerald-50/50" : "border-gray-200 hover:border-gray-300")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (otpLogin ? "bg-emerald-100" : "bg-gray-100")}>
                      <svg className={"w-4 h-4 " + (otpLogin ? "text-emerald-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900">OTP Login</span>
                    {firebaseOtpEnabled && <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded-full">FIREBASE</span>}
                  </div>
                  <input type="checkbox" checked={otpLogin} onChange={(e) => setOtpLogin(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">With OTP Login, customers can log in using their phone number. New customers can create accounts instantly.</p>
              </label>

              {/* Firebase OTP Note */}
              {firebaseOtpEnabled && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-orange-500 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3.89 15.672L6.255 0.461A0.542 0.542 0 017.27 0.288l2.543 4.771L3.89 15.672zm16.794 3.692l-2.25-14a0.543 0.543 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0l8.924-4.427z"/></svg>
                  <div>
                    <p className="text-xs font-semibold text-orange-800">Firebase OTP is Active</p>
                    <p className="text-[10px] text-orange-600 mt-0.5">OTP will be sent through Firebase instead of SMS providers. <a href='/admin/firebase-otp' className='underline font-semibold'>Configure</a></p>
                  </div>
                </div>
              )}

              {/* Social Login */}
              <label className={"cursor-pointer rounded-xl border-2 p-4 transition-all " + (socialLogin ? "border-purple-400 bg-purple-50/50" : "border-gray-200 hover:border-gray-300")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (socialLogin ? "bg-purple-100" : "bg-gray-100")}>
                      <svg className={"w-4 h-4 " + (socialLogin ? "text-purple-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Social Login</span>
                  </div>
                  <input type="checkbox" checked={socialLogin} onChange={(e) => setSocialLogin(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">With Social Login, customers can log in using social media credentials. New customers can create accounts instantly.</p>
              </label>
            </div>

            {/* Warning */}
            {!manualLogin && !otpLogin && !socialLogin && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                <p className="text-xs text-red-700">At least one login method must remain active. Otherwise, customers will be unable to log in.</p>
              </div>
            )}

            {/* Social Media Login Setup */}
            {socialLogin && (
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Social Media Login Setup</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Choose which social media providers customers can use to login.</p>
                  </div>
                  <a href="/admin/settings" className="text-[11px] text-purple-600 font-semibold hover:underline flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Configure credentials in 3rd Party
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {googleActive && (
                  <label className={"flex items-center justify-between rounded-xl border-2 p-3.5 cursor-pointer transition-all " + (googleLogin ? "border-blue-300 bg-blue-50/50" : "border-gray-200")}>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <div><span className="text-sm font-semibold text-gray-900">Google</span><p className="text-[10px] text-green-600">✅ Credentials set</p></div>
                    </div>
                    <input type="checkbox" checked={googleLogin} onChange={(e) => setGoogleLogin(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                  </label>
                  )}
                  {facebookActive && (
                  <label className={"flex items-center justify-between rounded-xl border-2 p-3.5 cursor-pointer transition-all " + (facebookLogin ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200")}>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <div><span className="text-sm font-semibold text-gray-900">Facebook</span><p className="text-[10px] text-green-600">✅ Credentials set</p></div>
                    </div>
                    <input type="checkbox" checked={facebookLogin} onChange={(e) => setFacebookLogin(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  </label>
                  )}
                  {appleActive && (
                  <label className={"flex items-center justify-between rounded-xl border-2 p-3.5 cursor-pointer transition-all " + (appleLogin ? "border-gray-400 bg-gray-50" : "border-gray-200")}>
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                      <div><span className="text-sm font-semibold text-gray-900">Apple</span><p className="text-[10px] text-green-600">✅ Credentials set</p></div>
                    </div>
                    <input type="checkbox" checked={appleLogin} onChange={(e) => setAppleLogin(e.target.checked)} className="rounded text-gray-600 focus:ring-gray-500" />
                  </label>
                  )}
                  {!googleActive && !facebookActive && !appleActive && (
                    <div className="col-span-3 text-center py-4">
                      <p className="text-sm text-gray-500">No social login providers are configured.</p>
                      <a href="/admin/settings" className="mt-2 inline-block text-xs text-purple-600 font-semibold hover:underline">Go to 3rd Party to configure →</a>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[11px] text-blue-700">Only providers with active credentials appear above. Go to the <a href="/admin/settings" className="font-bold underline text-blue-800">3rd Party</a> page to configure or activate providers.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Verification</h3>
            <p className="text-xs text-gray-500 mt-0.5">The option you select from below will need to be verified by the customer during registration.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={"flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all " + (emailVerification ? "border-blue-300 bg-blue-50/50" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                  <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + (emailVerification ? "bg-blue-100" : "bg-gray-100")}>
                    <svg className={"w-4 h-4 " + (emailVerification ? "text-blue-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">Email Verification</span>
                    <p className="text-[10px] text-gray-500">Customers must verify their email with an OTP.</p>
                  </div>
                </div>
                <input type="checkbox" checked={emailVerification} onChange={(e) => setEmailVerification(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
              </label>
              <label className={"flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all " + (phoneVerification ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                  <div className={"w-9 h-9 rounded-lg flex items-center justify-center " + (phoneVerification ? "bg-emerald-100" : "bg-gray-100")}>
                    <svg className={"w-4 h-4 " + (phoneVerification ? "text-emerald-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">Phone Verification</span>
                    {firebaseOtpEnabled && <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded-full">FIREBASE</span>}
                    <p className="text-[10px] text-gray-500">Customers must verify their phone with an OTP.</p>
                  </div>
                </div>
                <input type="checkbox" checked={phoneVerification} onChange={(e) => setPhoneVerification(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={saveLoginSetup} disabled={saving === -4} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30">
            {saving === -4 ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Login Setup</>}
          </button>
        </div>
      </div>}

      {/* ===================== PANEL LOGIN PAGE URL TAB ===================== */}
      {tab === "panel_url" && <div className="max-w-2xl space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Custom Login URLs</p>
            <p className="text-xs text-blue-600 mt-1">Set custom, secure login page URLs for each panel. Use only letters, numbers, hyphens, and underscores. After saving, the login page will be accessible at the new URL.</p>
          </div>
        </div>

        {/* Admin Login URL */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Admin Login URL</h3>
              <p className="text-xs text-gray-500">Custom URL for admin panel login page</p>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Login URL <span className="text-red-500">*</span></label>
            <div className="flex items-center">
              <span className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-mono whitespace-nowrap">{baseUrl}/login/</span>
              <input
                type="text"
                value={adminLoginUrl}
                onChange={(e) => setAdminLoginUrl(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ""))}
                placeholder="admin"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Full URL: <span className="font-mono text-gray-600">{baseUrl}/login/{adminLoginUrl || "admin"}</span></p>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveLoginUrl("admin", adminLoginUrl)} disabled={saving === -50} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
                {saving === -50 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Owner Login URL */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Owner Login URL</h3>
              <p className="text-xs text-gray-500">Custom URL for owner panel login page</p>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner Login URL <span className="text-red-500">*</span></label>
            <div className="flex items-center">
              <span className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-mono whitespace-nowrap">{baseUrl}/login/</span>
              <input
                type="text"
                value={ownerLoginUrl}
                onChange={(e) => setOwnerLoginUrl(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ""))}
                placeholder="owner"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Full URL: <span className="font-mono text-gray-600">{baseUrl}/login/{ownerLoginUrl || "owner"}</span></p>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveLoginUrl("owner", ownerLoginUrl)} disabled={saving === -50} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
                {saving === -50 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Customer Login URL */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Customer Login URL</h3>
              <p className="text-xs text-gray-500">Custom URL for customer login page</p>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Login URL <span className="text-red-500">*</span></label>
            <div className="flex items-center">
              <span className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-mono whitespace-nowrap">{baseUrl}/login/</span>
              <input
                type="text"
                value={customerLoginUrl}
                onChange={(e) => setCustomerLoginUrl(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ""))}
                placeholder="user"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Full URL: <span className="font-mono text-gray-600">{baseUrl}/login/{customerLoginUrl || "user"}</span></p>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveLoginUrl("customer", customerLoginUrl)} disabled={saving === -50} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                {saving === -50 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>}

      </>}
    </DashboardShell>
  );
}
