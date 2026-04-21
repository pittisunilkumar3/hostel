"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

type UserType = "CUSTOMER" | "OWNER";

interface MessageData {
  id?: number;
  key: string;
  message: string | null;
  status: boolean;
}

const USER_TYPE_TABS: { key: UserType; label: string; color: string }[] = [
  { key: "CUSTOMER", label: "Customer", color: "green" },
  { key: "OWNER", label: "Owner", color: "blue" },
];

// Available variables for message templates
const TEMPLATE_VARIABLES = [
  { variable: "{userName}", description: "Name of the user" },
  { variable: "{userEmail}", description: "Email of the user" },
  { variable: "{bookingId}", description: "The booking ID" },
  { variable: "{roomNumber}", description: "The room number" },
  { variable: "{checkInDate}", description: "Check-in date" },
  { variable: "{checkOutDate}", description: "Check-out date" },
  { variable: "{totalAmount}", description: "Total booking amount" },
  { variable: "{hostelName}", description: "Hostel name" },
  { variable: "{otp}", description: "OTP code for verification" },
];

export default function NotificationMessagesPage() {
  const [messageKeys, setMessageKeys] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, MessageData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeType, setActiveType] = useState<UserType>("CUSTOMER");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showVariables, setShowVariables] = useState(false);

  // Local state for edited values
  const [editedMessages, setEditedMessages] = useState<Record<string, { message: string; status: boolean }>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [activeType]);

  const fetchMessages = async () => {
    setLoading(true);
    setMessage(null);
    setDirty(false);
    try {
      const res = await apiFetch(`/api/notification-messages?user_type=${activeType}`);
      if (res.success) {
        setMessageKeys(res.data.messageKeys || {});
        setMessages(res.data.messages || {});
        // Initialize edited state
        const edited: Record<string, { message: string; status: boolean }> = {};
        for (const [key, msgRaw] of Object.entries(res.data.messages || {})) {
          const msg = msgRaw as { id?: number; key: string; message: string | null; status: boolean };
          edited[key] = { message: msg.message || "", status: msg.status };
        }
        // Also add keys that don't have messages yet
        for (const [, key] of Object.entries<string>(res.data.messageKeys || {})) {
          if (!edited[key]) {
            edited[key] = { message: "", status: false };
          }
        }
        setEditedMessages(edited);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageChange = (key: string, value: string) => {
    setEditedMessages((prev) => ({ ...prev, [key]: { ...prev[key], message: value } }));
    setDirty(true);
  };

  const handleStatusChange = (key: string, checked: boolean) => {
    setEditedMessages((prev) => ({ ...prev, [key]: { ...prev[key], status: checked } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates: Array<{ key: string; message: string; status: boolean }> = [];
      for (const [label, key] of Object.entries(messageKeys)) {
        const edited = editedMessages[key];
        if (edited) {
          updates.push({ key, message: edited.message, status: edited.status });
        }
      }

      const res = await apiFetch("/api/notification-messages", {
        method: "PUT",
        body: JSON.stringify({ user_type: activeType, messages: updates }),
      });

      if (res.success) {
        setMessage({ type: "success", text: "✅ Notification messages saved successfully!" });
        fetchMessages();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchMessages();
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Messages</h1>
            <p className="text-gray-500 text-sm mt-0.5">Configure push notification templates for each event</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-amber-800">
            Setup push notification messages for {activeType.toLowerCase()}s. Use variables like <code className="bg-amber-100 px-1 rounded">{`{userName}`}</code>, <code className="bg-amber-100 px-1 rounded">{`{bookingId}`}</code>, etc. to include dynamic content.
          </p>
        </div>
        <button
          onClick={() => setShowVariables(true)}
          className="shrink-0 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Insert Variable
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* User Type Tabs */}
      <div className="flex gap-2 mb-5">
        {USER_TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveType(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeType === tab.key
                ? `bg-${tab.color}-600 text-white shadow-lg`
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Push Notification Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Push Notification
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure and customize push notification messages for each event.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Object.entries(messageKeys).map(([label, key]) => {
                  const edited = editedMessages[key];
                  if (!edited) return null;
                  return (
                    <div key={key} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700 capitalize flex items-center gap-1.5">
                          {label.replace(/_/g, " ")}
                          <span className="text-[10px] text-gray-400 font-normal">(Default)</span>
                        </label>
                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium ${edited.status ? "text-green-600" : "text-gray-400"}`}>
                            {edited.status ? "ON" : "OFF"}
                          </span>
                          <button
                            onClick={() => handleStatusChange(key, !edited.status)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                              edited.status ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                edited.status ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={edited.message}
                        onChange={(e) => handleMessageChange(key, e.target.value)}
                        placeholder={`Ex: ${label.replace(/_/g, " ")}`}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                dirty
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
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
                  Save Information
                </>
              )}
            </button>
            {dirty && !saving && (
              <span className="text-xs text-amber-600 font-medium">⚠ Unsaved changes</span>
            )}
          </div>
        </>
      )}

      {/* Variables Modal */}
      <dialog
        id="variables-modal"
        className="rounded-2xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full"
        open={showVariables}
      >
        {showVariables && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Insert Variable</h3>
              <button onClick={() => setShowVariables(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Use these placeholders in your notification templates to include dynamic content.</p>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <div
                  key={v.variable}
                  className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-700">{v.description}</span>
                  <code className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{v.variable}</code>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowVariables(false)}
              className="mt-5 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Got It
            </button>
          </div>
        )}
      </dialog>
    </DashboardShell>
  );
}
