"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

export default function FirebaseOtpPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showHowModal, setShowHowModal] = useState(false);

  const [firebaseOtpEnabled, setFirebaseOtpEnabled] = useState(false);
  const [firebaseWebApiKey, setFirebaseWebApiKey] = useState("");
  const [isSmsActive, setIsSmsActive] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiFetch("/api/settings/firebase-otp");
      if (res.success && res.data) {
        setFirebaseOtpEnabled(res.data.firebase_otp_verification || false);
        setFirebaseWebApiKey(res.data.firebase_web_api_key || "");
        setIsSmsActive(res.data.is_sms_active || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/firebase-otp", {
        method: "PUT",
        body: JSON.stringify({
          firebase_otp_verification: firebaseOtpEnabled,
          firebase_web_api_key: firebaseWebApiKey,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Firebase OTP configuration saved successfully!" });
        fetchConfig();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.89 15.672L6.255 0.461A0.542 0.542 0 017.27 0.288l2.543 4.771L3.89 15.672zm16.794 3.692l-2.25-14a0.543 0.543 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0l8.924-4.427zM14.3 7.147l-1.82-3.482a0.542 0.542 0 00-.96 0L3.53 17.984 14.3 7.147z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Firebase OTP Verification</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure Firebase to send OTP for phone verification</p>
          </div>
        </div>
        <button
          onClick={() => setShowHowModal(true)}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-semibold"
        >
          <strong>How it Works</strong>
          <div className="animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>
      </div>

      {/* SMS Status Warning */}
      {!isSmsActive && !firebaseOtpEnabled && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">No SMS provider active</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Neither SMS nor Firebase OTP is currently active. Phone-based OTP login and verification will not work. Enable Firebase OTP below or configure an SMS provider in the 3rd Party tab.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-orange-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.89 15.672L6.255 0.461A0.542 0.542 0 017.27 0.288l2.543 4.771L3.89 15.672zm16.794 3.692l-2.25-14a0.543 0.543 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0l8.924-4.427zM14.3 7.147l-1.82-3.482a0.542 0.542 0 00-.96 0L3.53 17.984 14.3 7.147z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Firebase OTP Verification</h3>
                <p className="text-xs text-gray-500">When enabled, OTP will be sent through Firebase instead of SMS providers</p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Toggle + Web API Key in same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              {/* Toggle */}
              <div>
                <label className="flex items-center justify-between border-2 rounded-xl px-5 py-4 cursor-pointer transition-all hover:border-orange-300">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Firebase OTP Verification Status
                    </span>
                    <span className="text-red-500 text-xs" title="If this field is active, customers get the OTP through Firebase.">
                      <svg className="w-4 h-4 text-red-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      *
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={firebaseOtpEnabled}
                      onChange={e => setFirebaseOtpEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${firebaseOtpEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${firebaseOtpEnabled ? "translate-x-6" : ""}`} />
                  </div>
                </label>
                {firebaseOtpEnabled && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[11px] text-blue-700">
                      <strong>Note:</strong> Enable Firebase OTP means users will <strong>not</strong> receive verification codes through Email or SMS, although those methods are activated.
                    </p>
                  </div>
                )}
              </div>

              {/* Web API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Web API Key</label>
                <input
                  type="text"
                  value={firebaseWebApiKey}
                  onChange={e => setFirebaseWebApiKey(e.target.value)}
                  placeholder="Ex: AIzaSy..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="text-xs text-orange-700">
                <p>
                  For configuring OTP in Firebase, you must create a Firebase project first. If you haven't created a project yet, please{" "}
                  <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline font-semibold">create one</a>.
                </p>
                <p className="mt-1">
                  Make sure you have already configured Firebase Push Notification with valid credentials before enabling Firebase OTP.
                </p>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setFirebaseOtpEnabled(false); setFirebaseWebApiKey(""); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                Reset
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-8 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save Information
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it Works Modal */}
      {showHowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Instructions</h3>
              <button onClick={() => setShowHowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                For configuring OTP in Firebase, you must create a Firebase project first. If you haven't created any project for your application yet, please create a project first.
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Now go to the{" "}
                <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase console</a>{" "}
                and follow the instructions below:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Go to your Firebase project.</li>
                <li>Navigate to the <strong>Build</strong> menu from the left sidebar and select <strong>Authentication</strong>.</li>
                <li>Get started the project and go to the <strong>Sign-in method</strong> tab.</li>
                <li>From the Sign-in providers section, select the <strong>Phone</strong> option.</li>
                <li>Ensure to <strong>enable</strong> the method Phone and press <strong>save</strong>.</li>
              </ol>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowHowModal(false)}
                className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
