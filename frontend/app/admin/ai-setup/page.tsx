"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

type Tab = "config" | "settings";

export default function AISetupPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("config");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showWorksModal, setShowWorksModal] = useState(false);

  // Config state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiOrg, setOpenaiOrg] = useState("");

  // Settings state
  const [sectionWiseLimit, setSectionWiseLimit] = useState("0");
  const [imageUploadLimit, setImageUploadLimit] = useState("0");

  useEffect(() => {
    setUser(getCurrentUser());
    Promise.all([fetchConfig(), fetchSettings()]);
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiFetch("/api/settings/openai-config");
      if (res.success && res.data) {
        setOpenaiApiKey(res.data.OPENAI_API_KEY || "");
        setOpenaiOrg(res.data.OPENAI_ORGANIZATION || "");
        setAiEnabled(res.data.status === 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/settings/openai-settings");
      if (res.success && res.data) {
        setSectionWiseLimit(res.data.section_wise_ai_limit ?? "0");
        setImageUploadLimit(res.data.image_upload_limit_for_ai ?? "0");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAI = async () => {
    const newStatus = !aiEnabled;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/openai-status", {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        setAiEnabled(newStatus);
        setMessage({ type: "success", text: `✅ OpenAI ${newStatus ? "enabled" : "disabled"} successfully!` });
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/openai-config", {
        method: "PUT",
        body: JSON.stringify({
          OPENAI_API_KEY: openaiApiKey,
          OPENAI_ORGANIZATION: openaiOrg,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ OpenAI configuration saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/openai-settings", {
        method: "PUT",
        body: JSON.stringify({
          section_wise_ai_limit: sectionWiseLimit,
          image_upload_limit_for_ai: imageUploadLimit,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ AI settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
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
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OpenAI Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure AI-powered features and set usage limits</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab("config"); setMessage(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "config" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          AI Configuration
        </button>
        <button
          onClick={() => { setTab("settings"); setMessage(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "settings" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          AI Settings
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-violet-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <>
          {/* ===================== AI CONFIGURATION TAB ===================== */}
          {tab === "config" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">OpenAI Configuration</h3>
                  </div>
                  <button
                    onClick={() => setShowWorksModal(true)}
                    className="flex items-center gap-2 text-violet-600 hover:text-violet-700 text-sm font-semibold"
                  >
                    <strong>How it Works</strong>
                    <div className="animate-pulse">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                {/* Toggle */}
                <div className="flex justify-center">
                  <label className="flex items-center gap-3 border-2 rounded-xl px-5 py-3 transition-all cursor-pointer hover:border-violet-300">
                    <span className="text-sm font-medium text-gray-700">
                      {aiEnabled ? "Turn OFF" : "Turn ON"}
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={toggleAI}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${aiEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${aiEnabled ? "translate-x-6" : ""}`} />
                    </div>
                  </label>
                </div>

                {/* Config Fields */}
                <div className={aiEnabled ? "" : "opacity-50 pointer-events-none"}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">OpenAI API Key</label>
                      <input
                        type="text"
                        value={openaiApiKey}
                        onChange={e => setOpenaiApiKey(e.target.value)}
                        placeholder="Ex: sk-proj-K0LhsdcbHJ......."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">OpenAI Organization</label>
                      <input
                        type="text"
                        value={openaiOrg}
                        onChange={e => setOpenaiOrg(e.target.value)}
                        placeholder="Ex: org-xxxxxxxxxxx"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  {message && (
                    <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
                      message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      onClick={() => { setOpenaiApiKey(""); setOpenaiOrg(""); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={saveConfig}
                      disabled={saving}
                      className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
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
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== AI SETTINGS TAB ===================== */}
          {tab === "settings" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Restaurant Limits on Using AI</h3>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                {/* Section-wise data generation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-1">
                    <h4 className="text-sm font-bold text-gray-900">Section-wise Data Generation</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Set how many times AI can generate data for each element of the panel or app
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Section-wise data generation limit
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={99999999999}
                        value={sectionWiseLimit}
                        onChange={e => setSectionWiseLimit(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Image-based data generation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-1">
                    <h4 className="text-sm font-bold text-gray-900">Image-based Data Generation</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Set how many times AI can generate data from an image upload
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Image upload generation limit
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={99999999999}
                        value={imageUploadLimit}
                        onChange={e => setImageUploadLimit(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                      />
                    </div>
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
                    onClick={() => { setSectionWiseLimit("0"); setImageUploadLimit("0"); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Reset
                  </button>
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
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
        </>
      )}

      {/* How it Works Modal */}
      {showWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Enable OpenAI Configuration</h3>
              <button onClick={() => setShowWorksModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h5 className="text-lg font-bold text-gray-900 mb-4">Enable OpenAI Configuration</h5>
              <ul className="text-left text-sm text-gray-600 space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Go to the OpenAI API platform and{" "}
                  <a href="https://platform.openai.com/docs/overview" target="_blank" className="text-blue-600 underline">
                    sign up / log in
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Create a new API key and copy the API key.
                </li>
              </ul>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowWorksModal(false)}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700"
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
