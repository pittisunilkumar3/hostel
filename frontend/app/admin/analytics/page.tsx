"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

interface AnalyticsTool {
  key: string;
  title: string;
  placeholder: string;
  icon: string;
}

interface AnalyticsData {
  id?: number;
  name?: string;
  type?: string;
  script_id?: string;
  is_active?: number;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  linkedin: <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  facebook: <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  pinterest: <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>,
  snapchat: <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.4-.15.842-.318 1.33-.318.316 0 .598.058.845.165.638.277.946.7.949.968.006.27-.196.629-.878.964-.116.058-.272.12-.444.183-.488.178-1.23.448-1.426.962-.083.213-.052.462.092.742a7.583 7.583 0 001.19 1.738c.69.754 1.474 1.297 2.27 1.571.14.047.254.107.34.165-.08.246-.326.425-.823.632-.59.245-1.36.37-1.777.44-.088.194-.17.513-.235.755-.033.126-.07.26-.114.394-.085.253-.277.379-.557.379h-.03c-.28 0-.634-.058-1.054-.13-.394-.068-.851-.146-1.354-.146-.143 0-.285.007-.427.021-.736.074-1.396.39-2.097.724-.79.376-1.606.764-2.617.764h-.144c-1.011 0-1.827-.388-2.617-.764-.701-.334-1.36-.65-2.097-.724a4.466 4.466 0 00-.427-.021c-.503 0-.96.078-1.354.146-.42.072-.774.13-1.054.13h-.03c-.28 0-.472-.126-.557-.379a5.803 5.803 0 01-.114-.394c-.066-.242-.147-.56-.235-.755-.417-.07-1.187-.195-1.777-.44C.326 17.797.08 17.618 0 17.372c.086-.058.2-.118.34-.165.796-.274 1.58-.817 2.27-1.571a7.58 7.58 0 001.19-1.738c.144-.28.175-.529.092-.742-.196-.514-.938-.784-1.426-.962a4.397 4.397 0 01-.444-.183C.346 11.676.144 11.317.15 11.047c.003-.268.311-.691.949-.968.247-.107.529-.165.845-.165.488 0 .93.168 1.33.318.263.094.622.229.922.214.2 0 .327-.046.4-.09a14.26 14.26 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C6.653 1.069 10.01.793 11 .793h.206z"/></svg>,
  tiktok: <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  twitter: <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

const MODAL_INFO: Record<string, { title: string; steps: string[]; link?: string; linkText?: string }> = {
  google_analytics: {
    title: "Google Analytics Setup",
    steps: [
      "Go to Google Analytics and sign in with your Google account",
      "Create a new property or select an existing one",
      "Go to Admin → Property Settings → find your Measurement ID (starts with G-)",
      "Copy the Measurement ID and paste it in the field above",
    ],
    link: "https://analytics.google.com/",
    linkText: "Google Analytics Console",
  },
  google_tag_manager: {
    title: "Google Tag Manager Setup",
    steps: [
      "Go to Google Tag Manager and create an account/container",
      "Install the GTM container snippet on your website",
      "Find your GTM Container ID (starts with GTM-)",
      "Copy the Container ID and paste it in the field above",
    ],
    link: "https://tagmanager.google.com/",
    linkText: "Google Tag Manager",
  },
  linkedin_insight: {
    title: "LinkedIn Insight Tag Setup",
    steps: [
      "Go to LinkedIn Campaign Manager",
      "Navigate to Account Assets → Insight Tag",
      "Create a new Insight Tag or copy the Partner ID from an existing one",
      "Paste the LinkedIn Insight Tag ID in the field above",
    ],
    link: "https://www.linkedin.com/campaignmanager/",
    linkText: "LinkedIn Campaign Manager",
  },
  meta_pixel: {
    title: "Meta Pixel Setup",
    steps: [
      "Go to Facebook Events Manager",
      "Create a new Pixel or select an existing one",
      "Copy your Pixel ID",
      "Paste the Meta Pixel ID in the field above",
    ],
    link: "https://business.facebook.com/events_manager/",
    linkText: "Facebook Events Manager",
  },
  pinterest_tag: {
    title: "Pinterest Pixel Setup",
    steps: [
      "Log in to Pinterest Business Account",
      "Go to Ads → Conversions → Install Pinterest Tag",
      "Copy your Tag ID",
      "Paste the Pinterest Tag ID in the field above",
    ],
    link: "https://ads.pinterest.com/",
    linkText: "Pinterest Ads Manager",
  },
  snapchat_tag: {
    title: "Snapchat Pixel Setup",
    steps: [
      "Log in to Snapchat Ads Manager",
      "Go to Events Manager → Create Pixel",
      "Copy your Snap Pixel ID",
      "Paste the Snap Pixel ID in the field above",
    ],
    link: "https://ads.snapchat.com/",
    linkText: "Snapchat Ads Manager",
  },
  tiktok_tag: {
    title: "TikTok Pixel Setup",
    steps: [
      "Log in to TikTok Ads Manager",
      "Go to Assets → Events → Manage Pixel",
      "Create a new Pixel or copy existing Pixel ID",
      "Paste the TikTok Pixel ID in the field above",
    ],
    link: "https://ads.tiktok.com/",
    linkText: "TikTok Ads Manager",
  },
  twitter_tag: {
    title: "X (Twitter) Pixel Setup",
    steps: [
      "Log in to X Ads Manager",
      "Go to Tools → Conversion Tracking",
      "Create a new Pixel or copy existing Pixel ID",
      "Paste the Pixel ID in the field above",
    ],
    link: "https://ads.twitter.com/",
    linkText: "X Ads Manager",
  },
};

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tools, setTools] = useState<AnalyticsTool[]>([]);
  const [dataMap, setDataMap] = useState<Record<string, AnalyticsData>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/settings/analytics");
      if (res.success && res.data) {
        setTools(res.data.tools || []);
        const dMap = res.data.data || {};
        setDataMap(dMap);
        const ev: Record<string, string> = {};
        for (const [k, v] of Object.entries(dMap)) {
          ev[k] = (v as any).script_id || "";
        }
        setEditValues(ev);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveScript = async (tool: AnalyticsTool) => {
    setSaving(tool.key);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/analytics/update", {
        method: "POST",
        body: JSON.stringify({ type: tool.key, script_id: editValues[tool.key] || "" }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${tool.title} saved successfully!` });
        fetchAnalytics();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(null);
    }
  };

  const toggleScript = async (tool: AnalyticsTool) => {
    setSaving(tool.key + "_toggle");
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/analytics/toggle", {
        method: "PATCH",
        body: JSON.stringify({ type: tool.key }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${tool.title} ${res.data.is_active ? "enabled" : "disabled"}!` });
        fetchAnalytics();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(null);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Tool</h1>
        <p className="text-gray-500 mt-1">Configure analytics and tracking scripts for your platform</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-blue-800">
          In this page you can add credentials to show your analytics on the platform. Make sure to fill in proper data, otherwise you will not see the analytics properly.
        </span>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tools.map((tool) => {
            const data = dataMap[tool.key];
            const isActive = data?.is_active === 1;
            const hasScript = !!(data?.script_id);
            const isSaving = saving === tool.key;
            const isToggling = saving === tool.key + "_toggle";
            const modalInfo = MODAL_INFO[tool.key];

            return (
              <div key={tool.key} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                isActive ? "border-green-300 shadow-lg shadow-green-100" : "border-gray-100 shadow-sm hover:shadow-md"
              }`}>
                <div className="p-5">
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? "bg-green-50" : "bg-gray-50"
                      }`}>
                        {TOOL_ICONS[tool.icon] || <span className="text-2xl">📊</span>}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900">{tool.title}</h2>
                        {modalInfo && (
                          <button
                            onClick={() => setShowModal(tool.key)}
                            className="text-xs text-blue-600 font-semibold hover:underline mt-0.5"
                          >
                            How it works →
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      {/* Toggle */}
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleScript(tool)}
                            disabled={isToggling || !hasScript}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors peer-checked:bg-green-500 ${
                            !hasScript ? "bg-gray-200 opacity-50" : isActive ? "bg-green-500" : "bg-gray-300"
                          }`} />
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5 ${
                            isToggling ? "opacity-50" : ""
                          }`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Script ID Input + Save */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{tool.title} ID</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={editValues[tool.key] || ""}
                        onChange={e => setEditValues(prev => ({ ...prev, [tool.key]: e.target.value }))}
                        placeholder={tool.placeholder}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                      <button
                        onClick={() => saveScript(tool)}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
                      >
                        {isSaving ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                        Save
                      </button>
                    </div>
                    {!hasScript && (
                      <p className="text-xs text-amber-600 mt-2">⚠ Please save a script ID first before enabling</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Modal */}
      {showModal && MODAL_INFO[showModal] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{MODAL_INFO[showModal].title}</h3>
              <button onClick={() => setShowModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-600">
                {MODAL_INFO[showModal].steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {MODAL_INFO[showModal].link && (
                <a
                  href={MODAL_INFO[showModal].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-blue-600 font-semibold hover:underline text-sm"
                >
                  {MODAL_INFO[showModal].linkText} →
                </a>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowModal(null)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
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
