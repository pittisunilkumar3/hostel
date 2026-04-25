"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

interface NotificationSetting {
  id: number;
  title: string;
  sub_title: string | null;
  key: string;
  type: string;
  mail_status: string;
  sms_status: string;
  push_notification_status: string;
}

export default function OwnerNotificationSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/owner"); return; }
    setUser(u);
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch("/api/owner/notification-settings");
      if (res.success && res.data) {
        // Filter to show only owner-related notifications
        const ownerNotifs = (Array.isArray(res.data) ? res.data : []).filter(
          (n: NotificationSetting) => n.type === "OWNER" || n.type === "ADMIN"
        );
        setNotifications(ownerNotifs);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id: number, channel: "mail" | "sms" | "push_notification", currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISABLE" : "ACTIVE";
    try {
      const res = await apiFetch(`/api/owner/notification-settings`, {
        method: "PUT",
        body: JSON.stringify({ id, channel, status: newStatus }),
      });
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => {
            if (n.id === id) {
              const field = `${channel}_status` as keyof NotificationSetting;
              return { ...n, [field]: newStatus };
            }
            return n;
          })
        );
        setMessage({ type: "success", text: "✅ Notification setting updated" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Failed to update" });
    }
  };

  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading notification settings...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notification Setup</h1>
        <p className="text-gray-500 mt-1">Configure how you receive notifications for bookings, payments, and other events.</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Notification Channels</h4>
          <p className="text-xs text-blue-700 mt-0.5">Enable or disable notifications via Email, SMS, or Push Notifications for different events.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Notification Settings Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Notification Channels</h3>
          <p className="text-xs text-gray-500 mt-0.5">Toggle notification channels for each event type</p>
        </div>
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-500 font-medium">No notification settings available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notification</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">SMS</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Push</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                      {notif.sub_title && <p className="text-xs text-gray-400 mt-0.5">{notif.sub_title}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggle(notif.id, "mail", notif.mail_status)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${notif.mail_status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notif.mail_status === "ACTIVE" ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggle(notif.id, "sms", notif.sms_status)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${notif.sms_status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notif.sms_status === "ACTIVE" ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggle(notif.id, "push_notification", notif.push_notification_status)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${notif.push_notification_status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notif.push_notification_status === "ACTIVE" ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
