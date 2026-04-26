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

const TYPE_TABS: { key: NotifType; label: string }[] = [
  { key: "ADMIN", label: "Admin" },
  { key: "OWNER", label: "Owner" },
  { key: "CUSTOMER", label: "Customer" },
];

export default function NotificationChannelsPage() {
  const [data, setData] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<NotifType>("ADMIN");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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
        setMessage({ type: "success", text: "Channel status updated successfully!" });
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
    title,
  }: {
    status: ChannelStatus;
    itemKey: string;
    type: string;
    channel: "mail" | "sms" | "push_notification";
    label: string;
    title: string;
  }) => {
    const toggleKey = `${itemKey}-${channel}`;
    const isDisabled = status === "DISABLE";
    const isActive = status === "ACTIVE";

    if (isDisabled) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
          N/A
        </span>
      );
    }

    return (
      <label
        className="relative inline-flex items-center cursor-pointer"
        title={`${isActive ? `Turn OFF ${label} for ${title}` : `Turn ON ${label} for ${title}`}`}
      >
        <input
          type="checkbox"
          checked={isActive}
          disabled={toggling === toggleKey}
          onChange={() => handleToggle(itemKey, type, channel)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
      </label>
    );
  };

  const filteredData = data.filter((d) => d.type === activeType);

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
      <div className="flex flex-wrap items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Notification Channels Setup</h1>
          </div>
        </div>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          <span>how_it_works!</span>
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-4 flex items-start gap-2 text-sm text-gray-600">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p>From here you setup who can see what types of notification from <strong>Hostel Management</strong></p>
      </div>

      {/* Type Tabs */}
      <ul className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {TYPE_TABS.map((tab) => (
          <li key={tab.key}>
            <button
              onClick={() => { setActiveType(tab.key); setMessage(null); }}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeType === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-12">SL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Topics</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Push Notification</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Mail</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">SMS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      No notification settings found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <h5 className="text-sm font-medium text-gray-900 capitalize">{item.title.replace(/_/g, " ")}</h5>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          Choose how {item.type.toLowerCase()} will get notified about {item.sub_title?.replace(/_/g, " ") || item.title.replace(/_/g, " ")}.
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <ChannelToggle
                            status={item.push_notification_status}
                            itemKey={item.key}
                            type={item.type}
                            channel="push_notification"
                            label="Push Notification"
                            title={item.title}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <ChannelToggle
                            status={item.mail_status}
                            itemKey={item.key}
                            type={item.type}
                            channel="mail"
                            label="Mail"
                            title={item.title}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <ChannelToggle
                            status={item.sms_status}
                            itemKey={item.key}
                            type={item.type}
                            channel="sms"
                            label="SMS"
                            title={item.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowHowItWorks(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Setup</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enable or disable the notification channel to control notifications for a specific feature or topic.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>For example,</strong> if the &apos;Booking Confirmed&apos; push notification is turned off for a customer, they will not receive a push notification when a booking is confirmed.
              </p>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Okay, Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
