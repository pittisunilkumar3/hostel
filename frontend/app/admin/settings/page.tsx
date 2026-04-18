"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  is_active: number;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"google" | "twilio">("google");
  const [user, setUser] = useState<any>(null);

  // Google settings
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleActive, setGoogleActive] = useState(false);

  // Twilio settings
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [twilioActive, setTwilioActive] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/settings");
      if (res.success) {
        const data: Setting[] = res.data;
        setSettings(data);
        data.forEach((s) => {
          if (s.setting_key === "google_client_id") { setGoogleClientId(s.setting_value || ""); setGoogleActive(s.is_active === 1); }
          if (s.setting_key === "google_client_secret") setGoogleClientSecret(s.setting_value || "");
          if (s.setting_key === "twilio_account_sid") { setTwilioSid(s.setting_value || ""); setTwilioActive(s.is_active === 1); }
          if (s.setting_key === "twilio_auth_token") setTwilioAuthToken(s.setting_value || "");
          if (s.setting_key === "twilio_phone_number") setTwilioPhone(s.setting_value || "");
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveGoogle = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/google", {
        method: "PUT",
        body: JSON.stringify({ clientId: googleClientId, clientSecret: googleClientSecret, isActive: googleActive }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Google settings saved successfully!" });
        fetchSettings();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); }
    finally { setSaving(false); }
  };

  const saveTwilio = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/twilio", {
        method: "PUT",
        body: JSON.stringify({ accountSid: twilioSid, authToken: twilioAuthToken, phoneNumber: twilioPhone, isActive: twilioActive }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Twilio settings saved successfully!" });
        fetchSettings();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">System Settings</h1>
      <p className="text-gray-500 mb-6">Configure Google Login & Twilio OTP services</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => { setActiveTab("google"); setMessage(null); }} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "google" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"}`}>
          🔑 Google Login
        </button>
        <button onClick={() => { setActiveTab("twilio"); setMessage(null); }} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "twilio" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"}`}>
          📱 Twilio OTP
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading settings...</div>
      ) : activeTab === "google" ? (
        /* Google Settings Form */
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Google OAuth Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Configure Google Client ID & Secret for social login</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">{googleActive ? "Active" : "Inactive"}</span>
              <div className="relative">
                <input type="checkbox" checked={googleActive} onChange={(e) => setGoogleActive(e.target.checked)} className="sr-only peer" />
                <div className={`w-11 h-6 rounded-full transition-colors ${googleActive ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${googleActive ? "translate-x-5" : ""}`}></div>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Client ID</label>
              <input type="text" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} placeholder="e.g. 123456789-abc.apps.googleusercontent.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Client Secret</label>
              <input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} placeholder="e.g. GOCSPX-xxxxxxxxx" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={saveGoogle} disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all">
              {saving ? "Saving..." : "Save Google Settings"}
            </button>
            <span className="text-xs text-gray-400">
              {googleActive ? "🟢 Google login is ACTIVE" : "🔴 Google login is DISABLED"}
            </span>
          </div>
        </div>
      ) : (
        /* Twilio Settings Form */
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Twilio OTP Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Configure Twilio credentials for phone OTP login</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">{twilioActive ? "Active" : "Inactive"}</span>
              <div className="relative">
                <input type="checkbox" checked={twilioActive} onChange={(e) => setTwilioActive(e.target.checked)} className="sr-only peer" />
                <div className={`w-11 h-6 rounded-full transition-colors ${twilioActive ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${twilioActive ? "translate-x-5" : ""}`}></div>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Account SID</label>
              <input type="text" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} placeholder="e.g. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Auth Token</label>
              <input type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} placeholder="e.g. your_auth_token_here" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Phone Number</label>
              <input type="text" value={twilioPhone} onChange={(e) => setTwilioPhone(e.target.value)} placeholder="e.g. +1234567890" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={saveTwilio} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all">
              {saving ? "Saving..." : "Save Twilio Settings"}
            </button>
            <span className="text-xs text-gray-400">
              {twilioActive ? "🟢 OTP login is ACTIVE" : "🔴 OTP login is DISABLED"}
            </span>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
