"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

type NotifType = "ADMIN" | "OWNER" | "CUSTOMER";
type ChannelStatus = "ACTIVE" | "INACTIVE" | "DISABLE";

interface NotificationSetting {
  id: number;
  title: string;
  sub_title: string | null;
  key: string;
  type: NotifType;
  mail_status: ChannelStatus;
  sms_status: ChannelStatus;
  push_notification_status: ChannelStatus;
}

const TYPE_TABS: { key: NotifType; label: string; color: string }[] = [
  { key: "ADMIN", label: "Admin", color: "purple" },
  { key: "OWNER", label: "Owner", color: "blue" },
  { key: "CUSTOMER", label: "Customer", color: "green" },
];

export default function NotificationChannelsPage() {
  const [data, setData] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<NotifType>("ADMIN");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [activeType]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/notification-settings?type=${activeType}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, type: string, channel: "mail" | "sms" | "push_notification") => {
    const toggleKey = `${key}-${channel}`;
    setToggling(toggleKey);
    setMessage(null);
    try {
      const res = await apiFetch("/api/notification-settings/toggle", {
        method: "PATCH",
        body: JSON.stringify({ key, type, channel }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Channel status updated!" });
        fetchSettings();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setToggling(null);
    }
  };

  const ChannelToggle = ({
    status,
    itemKey,
    type,
    channel,
    label,
  }: {
    status: ChannelStatus;
    itemKey: string;
    type: string;
    channel: "mail" | "sms" | "push_notification";
    label: string;
  }) => {
    const toggleKey = `${itemKey}-${channel}`;
    const isDisabled = status === "DISABLE";
    const isActive = status === "ACTIVE";

    if (isDisabled) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
          N/A
        </span>
      );
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => handleToggle(itemKey, type, channel)}
          disabled={toggling === toggleKey}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
            isActive ? "bg-green-500" : "bg-gray-300"
          } ${toggling === toggleKey ? "opacity-50" : ""}`}
          title={`${isActive ? "Turn OFF" : "Turn ON"} ${label} for ${itemKey}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-[10px] font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}>
          {isActive ? "ON" : "OFF"}
        </span>
      </div>
    );
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
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Channels</h1>
            <p className="text-gray-500 text-sm mt-0.5">Configure how each user type receives notifications</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-800">How it works</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Enable or disable notification channels (Mail / SMS / Push) for each event. For example, if &quot;Push&quot; is turned ON for &quot;New Booking&quot;, admins will receive a push notification when a new booking is created. Configure Firebase in <strong>3rd Party → Firebase Notification</strong> to enable push.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Type Tabs */}
      <div className="flex gap-2 mb-5">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveType(tab.key); setMessage(null); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeType === tab.key
                ? `bg-${tab.color}-600 text-white shadow-lg`
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-70">
              ({data.filter((d) => d.type === tab.key).length || "..."} items)
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Mail
                    </div>
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      SMS
                    </div>
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      Push
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No notification settings found</td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <h5 className="text-sm font-semibold text-gray-900 capitalize">{item.title.replace(/_/g, " ")}</h5>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.sub_title?.replace(/_/g, " ") || ""}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ChannelToggle status={item.mail_status} itemKey={item.key} type={item.type} channel="mail" label="Mail" />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ChannelToggle status={item.sms_status} itemKey={item.key} type={item.type} channel="sms" label="SMS" />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ChannelToggle status={item.push_notification_status} itemKey={item.key} type={item.type} channel="push_notification" label="Push" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            const modal = document.getElementById("how-it-works-modal") as HTMLDialogElement;
            if (modal) modal.showModal();
          }}
          className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <dialog id="how-it-works-modal" className="rounded-2xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">How Notification Channels Work</h3>
            <button
              onClick={() => { const m = document.getElementById("how-it-works-modal") as HTMLDialogElement; if (m) m.close(); }}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >&times;</button>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>Each notification event can be delivered via <strong>Mail</strong> or <strong>SMS</strong>.</p>
            <ul className="list-disc list-inside space-y-1">
              <li><span className="text-green-600 font-medium">ON</span> — Users will be notified through this channel</li>
              <li><span className="text-gray-400 font-medium">OFF</span> — This channel is disabled for this event</li>
              <li><span className="text-gray-300 font-medium">N/A</span> — This channel is not applicable</li>
            </ul>
            <p className="text-xs text-gray-400 mt-2">Example: If &quot;Mail&quot; is ON for &quot;New Booking&quot;, admins receive an email when a booking is made.</p>
          </div>
          <button
            onClick={() => { const m = document.getElementById("how-it-works-modal") as HTMLDialogElement; if (m) m.close(); }}
            className="mt-5 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
          >Got It</button>
        </div>
      </dialog>
    </DashboardShell>
  );
}
