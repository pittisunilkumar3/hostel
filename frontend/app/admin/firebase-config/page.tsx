"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

interface FCMCredentials {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export default function FirebaseConfigPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [serviceFileContent, setServiceFileContent] = useState("");
  const [projectId, setProjectId] = useState("");
  const [vapidKey, setVapidKey] = useState("");
  const [credentials, setCredentials] = useState<FCMCredentials>({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
  });

  useEffect(() => {
    setUser(getCurrentUser());
    fetchFirebaseConfig();
  }, []);

  const fetchFirebaseConfig = async () => {
    try {
      const res = await apiFetch("/api/settings/firebase");
      if (res.success && res.data) {
        setServiceFileContent(res.data.serviceFileContent || "");
        setProjectId(res.data.projectId || "");
        setVapidKey(res.data.vapidKey || "");
        setCredentials(res.data.fcmCredentials || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateCred = (key: keyof FCMCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/settings/firebase", {
        method: "PUT",
        body: JSON.stringify({
          push_notification_service_file_content: serviceFileContent,
          projectId,
          vapidKey,
          apiKey: credentials.apiKey,
          authDomain: credentials.authDomain,
          storageBucket: credentials.storageBucket,
          messagingSenderId: credentials.messagingSenderId,
          appId: credentials.appId,
          measurementId: credentials.measurementId,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Firebase configuration saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, mono = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; mono?: boolean;
  }) => (
    <div className="form-group">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={"w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all " + (mono ? "font-mono" : "")}
      />
    </div>
  );

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
        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firebase Push Notification Setup</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure Firebase Cloud Messaging (FCM) for push notifications</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.89 15.672L6.255 0.461A0.542 0.542 0 017.27 0.288l2.543 4.771L3.89 15.672zm16.794 3.692l-2.25-14a0.543 0.543 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0l8.924-4.427zM14.3 7.147l-1.82-3.482a0.542 0.542 0 00-.96 0L3.53 17.984 14.3 7.147z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Firebase Configuration</h3>
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-semibold"
            >
              <strong>Where to get this information</strong>
              <div className="animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-20">
              <svg className="animate-spin h-8 w-8 text-orange-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Service File Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service File Content
                  <span className="ml-1 inline-block" title="Select and copy all the service file content and add here">
                    <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </label>
                <textarea
                  value={serviceFileContent}
                  onChange={e => setServiceFileContent(e.target.value)}
                  rows={10}
                  placeholder='Paste your firebase service account JSON content here...'
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all resize-y"
                />
              </div>

              {/* API Key */}
              <InputField
                label="API Key"
                value={credentials.apiKey}
                onChange={v => updateCred("apiKey", v)}
                placeholder="Ex: AIzaSy..."
                mono
              />

              {/* Grid fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="FCM Project ID"
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Ex: my-awesome-app-12345"
                  mono
                />
                <InputField
                  label="Auth Domain"
                  value={credentials.authDomain}
                  onChange={v => updateCred("authDomain", v)}
                  placeholder="Ex: my-awesome-app.firebaseapp.com"
                  mono
                />
                <InputField
                  label="Storage Bucket"
                  value={credentials.storageBucket}
                  onChange={v => updateCred("storageBucket", v)}
                  placeholder="Ex: my-awesome-app.appspot.com"
                  mono
                />
                <InputField
                  label="Messaging Sender ID"
                  value={credentials.messagingSenderId}
                  onChange={v => updateCred("messagingSenderId", v)}
                  placeholder="Ex: 1234567890"
                  mono
                />
                <InputField
                  label="App ID"
                  value={credentials.appId}
                  onChange={v => updateCred("appId", v)}
                  placeholder="Ex: 1:1234567890:web:abc123"
                  mono
                />
                <InputField
                  label="Measurement ID"
                  value={credentials.measurementId}
                  onChange={v => updateCred("measurementId", v)}
                  placeholder="Ex: G-12345678"
                  mono
                />
              </div>

              {/* VAPID Key */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-amber-800 mb-1.5">Web Push VAPID Key</label>
                    <input
                      type="text"
                      value={vapidKey}
                      onChange={e => setVapidKey(e.target.value)}
                      placeholder="Ex: BPxx... (from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)"
                      className="w-full px-4 py-2.5 border border-amber-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all bg-white"
                    />
                    <p className="text-[10px] text-amber-600 mt-1.5">
                      Required for web push notifications. Get it from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates tab.
                    </p>
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

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-8 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
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
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Firebase Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Firebase Setup Guide</h3>
              <button onClick={() => setShowInfoModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.89 15.672L6.255 0.461A0.542 0.542 0 017.27 0.288l2.543 4.771L3.89 15.672zm16.794 3.692l-2.25-14a0.543 0.543 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0l8.924-4.427zM14.3 7.147l-1.82-3.482a0.542 0.542 0 00-.96 0L3.53 17.984 14.3 7.147z"/>
                </svg>
              </div>
              <h5 className="text-lg font-bold text-gray-900 mb-3">Setup FCM on Mobile Apps</h5>
              <p className="text-sm text-gray-600 mb-4">
                Please check the documentation below for detailed instructions on setting up your mobile app to receive Firebase Cloud Messaging (FCM) notifications.
              </p>
              <a
                href="https://firebase.google.com/docs/cloud-messaging"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-semibold hover:underline"
              >
                Click Here for Documentation →
              </a>
              <ol className="text-left text-sm text-gray-600 mt-5 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 underline">Firebase Console</a> and create/select a project</li>
                <li>Go to Project Settings → General → Your Apps → Web App</li>
                <li>Copy the <strong>firebaseConfig</strong> object values and paste them in the fields above</li>
                <li>For the Service File Content, go to Project Settings → Service Accounts → Generate New Private Key, then copy the JSON content</li>
              </ol>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowInfoModal(false)}
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
