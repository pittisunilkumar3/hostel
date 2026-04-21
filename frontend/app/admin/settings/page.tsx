"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";

// ==========================================
// Types
// ==========================================
interface OTPProvider {
  id: number;
  name: string;
  slug: string;
  provider_type: "twilio" | "msg91" | "textlocal" | "vonage" | "custom" | "firebase";
  description: string | null;
  logo_url: string | null;
  color: string;
  is_active: number;
  config: Record<string, string>;
  sort_order: number;
}

interface ProviderField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
  required?: boolean;
}

// ==========================================
// Provider field definitions
// ==========================================
const PROVIDER_FIELDS: Record<string, ProviderField[]> = {
  twilio: [
    { key: "account_sid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", required: true },
    { key: "auth_token", label: "Auth Token", type: "password", placeholder: "your_auth_token_here", required: true },
    { key: "phone_number", label: "Twilio Phone Number", type: "text", placeholder: "+1234567890", required: true },
  ],
  msg91: [
    { key: "auth_key", label: "Authentication Key", type: "password", placeholder: "Enter MSG91 Auth Key", required: true },
    { key: "sender_id", label: "Sender ID", type: "text", placeholder: "HSTL", required: true },
    { key: "template_id", label: "DLT Template ID", type: "text", placeholder: "Optional DLT template ID" },
  ],
  textlocal: [
    { key: "username", label: "Username / Email", type: "text", placeholder: "your@email.com", required: true },
    { key: "hash_key", label: "API Hash Key", type: "password", placeholder: "Enter TextLocal hash key", required: true },
    { key: "sender_id", label: "Sender Name", type: "text", placeholder: "HSTL", required: true },
  ],
  vonage: [
    { key: "api_key", label: "API Key", type: "text", placeholder: "Enter Vonage API Key", required: true },
    { key: "api_secret", label: "API Secret", type: "password", placeholder: "Enter Vonage API Secret", required: true },
    { key: "from_number", label: "From Number / Name", type: "text", placeholder: "Hostel" },
  ],
  firebase: [
    { key: "api_key", label: "Firebase API Key", type: "text", placeholder: "AIzaSy...", required: true },
    { key: "project_id", label: "Firebase Project ID", type: "text", placeholder: "my-project-123", required: true },
  ],
  custom: [
    { key: "api_url", label: "API Endpoint URL", type: "url", placeholder: "https://your-api.com/send-otp", required: true },
    { key: "api_key", label: "API Key / Token", type: "password", placeholder: "Bearer token or API key" },
    { key: "method", label: "HTTP Method", type: "text", placeholder: "POST" },
    { key: "header_name", label: "Custom Header Name", type: "text", placeholder: "X-API-Key (optional)" },
    { key: "header_value", label: "Custom Header Value", type: "password", placeholder: "Header value (optional)" },
  ],
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  twilio: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  ),
  msg91: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      <circle cx="8" cy="10" r="1.5"/>
      <circle cx="12" cy="10" r="1.5"/>
      <circle cx="16" cy="10" r="1.5"/>
    </svg>
  ),
  textlocal: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  ),
  vonage: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  firebase: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M3.89 15.672L6.255.461A.542.542 0 0 1 7.27.288l2.543 4.771L3.89 15.672zm16.794 3.692l-2.25-14a.54.54 0 0 0-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 0 0 1.588 0l8.924-4.427zM14.3 7.147l-1.82-3.482a.542.542 0 0 0-.96 0L3.53 17.984 14.3 7.147z"/>
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.485.485 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
    </svg>
  ),
};

// ==========================================
// Sidebar items (same as admin dashboard)
// ==========================================
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
    label: "Rooms",
    href: "/admin/rooms",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

// ==========================================
// Main Page Component
// ==========================================
export default function AdminSettings() {
  const [providers, setProviders] = useState<OTPProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null); // provider id being saved
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"google" | "otp">("otp");
  const [user, setUser] = useState<any>(null);

  // Google settings
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleActive, setGoogleActive] = useState(false);

  // Track edit states for each provider's config
  const [editConfigs, setEditConfigs] = useState<Record<number, Record<string, string>>>({});

  // Expanded card
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    Promise.all([fetchProviders(), fetchSettings()]);
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await apiFetch("/api/otp-providers");
      if (res.success && res.data.providers) {
        const provs = res.data.providers;
        setProviders(provs);
        // Initialize edit configs
        const configs: Record<number, Record<string, string>> = {};
        provs.forEach((p: OTPProvider) => {
          configs[p.id] = { ...(p.config || {}) };
        });
        setEditConfigs(configs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/settings");
      if (res.success) {
        const data = res.data;
        data.forEach((s: any) => {
          if (s.setting_key === "google_client_id") { setGoogleClientId(s.setting_value || ""); setGoogleActive(s.is_active === 1); }
          if (s.setting_key === "google_client_secret") setGoogleClientSecret(s.setting_value || "");
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveGoogle = async () => {
    setSaving(-1);
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
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(null);
    }
  };

  const toggleProvider = async (id: number, isActive: boolean) => {
    setSaving(id);
    setMessage(null);
    try {
      const res = await apiFetch(`/api/otp-providers/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      if (res.success) {
        setMessage({
          type: "success",
          text: `✅ ${res.data.name} ${isActive ? "activated" : "deactivated"} successfully!`,
        });
        fetchProviders();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to toggle" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(null);
    }
  };

  const saveProvider = async (provider: OTPProvider) => {
    setSaving(provider.id);
    setMessage(null);
    const config = editConfigs[provider.id] || {};
    try {
      const res = await apiFetch(`/api/otp-providers/${provider.id}`, {
        method: "PUT",
        body: JSON.stringify({ config }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${provider.name} configuration saved!` });
        fetchProviders();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(null);
    }
  };

  const updateConfigField = (providerId: number, key: string, value: string) => {
    setEditConfigs((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], [key]: value },
    }));
  };

  const isConfigDirty = (provider: OTPProvider) => {
    const original = provider.config || {};
    const edited = editConfigs[provider.id] || {};
    return JSON.stringify(original) !== JSON.stringify(edited);
  };

  const hasRequiredFields = (provider: OTPProvider) => {
    const fields = PROVIDER_FIELDS[provider.provider_type] || [];
    const config = editConfigs[provider.id] || {};
    return fields
      .filter((f) => f.required)
      .every((f) => (config[f.key] || "").trim() !== "");
  };

  // Active provider
  const activeProvider = providers.find((p) => p.is_active === 1);

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure authentication providers — Google Login & Multi OTP Gateways</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab("otp"); setMessage(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "otp"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          OTP Providers
          {activeProvider && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">ACTIVE</span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("google"); setMessage(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "google"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google Login
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-[fadeIn_0.3s_ease] ${
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
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      ) : activeTab === "otp" ? (
        /* ==================== OTP PROVIDERS TAB ==================== */
        <div>
          {/* Status Banner */}
          <div className={`mb-6 rounded-xl p-4 flex items-center gap-3 ${
            activeProvider
              ? "bg-green-50 border border-green-200"
              : "bg-amber-50 border border-amber-200"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              activeProvider ? "bg-green-100" : "bg-amber-100"
            }`}>
              {activeProvider ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${activeProvider ? "text-green-800" : "text-amber-800"}`}>
                {activeProvider
                  ? `Active Provider: ${activeProvider.name}`
                  : "No OTP provider is currently active"}
              </p>
              <p className={`text-xs mt-0.5 ${activeProvider ? "text-green-600" : "text-amber-600"}`}>
                {activeProvider
                  ? `Customers will receive OTP via ${activeProvider.name} (${activeProvider.provider_type})`
                  : "Activate one provider below to enable OTP login for customers"}
              </p>
            </div>
            {activeProvider && (
              <div className="shrink-0 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            )}
          </div>

          {/* Provider Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {providers.map((provider) => {
              const isExpanded = expandedId === provider.id;
              const isActive = provider.is_active === 1;
              const fields = PROVIDER_FIELDS[provider.provider_type] || [];
              const config = editConfigs[provider.id] || {};
              const dirty = isConfigDirty(provider);
              const hasRequired = hasRequiredFields(provider);

              return (
                <div
                  key={provider.id}
                  className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "border-green-300 shadow-lg shadow-green-100 ring-1 ring-green-200"
                      : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: `${provider.color}15`, color: provider.color }}
                      >
                        {PROVIDER_ICONS[provider.provider_type] || PROVIDER_ICONS.custom}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{provider.name}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {provider.description || `${provider.provider_type} OTP gateway`}
                        </p>
                      </div>

                      {/* Toggle Switch */}
                      <label className="flex flex-col items-end gap-1 cursor-pointer shrink-0">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => toggleProvider(provider.id, e.target.checked)}
                            className="sr-only peer"
                            disabled={saving === provider.id}
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                            isActive ? "bg-green-500" : "bg-gray-300"
                          } ${saving === provider.id ? "opacity-50" : ""}`} />
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            isActive ? "translate-x-6" : ""
                          }`} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 uppercase">
                          {isActive ? "ON" : "OFF"}
                        </span>
                      </label>
                    </div>

                    {/* Quick status row */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasRequired ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="text-gray-500">
                          {hasRequired ? "Configured" : "Not configured"}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-auto"
                      >
                        {isExpanded ? "Close" : "Configure"}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Config Form */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-5 animate-[fadeIn_0.2s_ease]">
                      <div className="space-y-4">
                        {fields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            <input
                              type={field.type}
                              value={config[field.key] || ""}
                              onChange={(e) => updateConfigField(provider.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => saveProvider(provider)}
                          disabled={saving === provider.id || !dirty}
                          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                            dirty
                              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {saving === provider.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Save Configuration
                            </>
                          )}
                        </button>
                        {dirty && (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                            Unsaved changes
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-indigo-800">How it works</p>
              <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
                Only <strong>one OTP provider</strong> can be active at a time. When you toggle a provider ON, all others are automatically deactivated.
                Click <strong>Configure</strong> to enter the provider&apos;s API credentials. Customers will receive OTPs via the active provider.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== GOOGLE SETTINGS TAB ==================== */
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Google OAuth</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Enable social login with Google accounts</p>
                </div>
              </div>
              <label className="flex flex-col items-end gap-1 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={googleActive} onChange={(e) => setGoogleActive(e.target.checked)} className="sr-only peer" />
                  <div className={`w-12 h-6 rounded-full transition-colors ${googleActive ? "bg-green-500" : "bg-gray-300"}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${googleActive ? "translate-x-6" : ""}`} />
                </div>
                <span className="text-[10px] font-medium text-gray-400 uppercase">{googleActive ? "ON" : "OFF"}</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Client ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Client Secret <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder="e.g. GOCSPX-xxxxxxxxx"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={saveGoogle}
                disabled={saving === -1}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                {saving === -1 ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save Google Settings
                  </>
                )}
              </button>
              <span className="text-xs text-gray-400">
                {googleActive ? "🟢 Google login is ACTIVE" : "🔴 Google login is DISABLED"}
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
