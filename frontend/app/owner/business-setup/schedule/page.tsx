"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

const ic = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all";

export default function OwnerScheduleSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hostelStatus, setHostelStatus] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [minimumStay, setMinimumStay] = useState("1");

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/owner"); return; }
    setUser(u);
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/owner/business-settings");
      if (res.success && res.data?.hostel) {
        const h = res.data.hostel;
        setHostelStatus(h.status || "");
        setCheckInTime(h.check_in_time || "14:00");
        setCheckOutTime(h.check_out_time || "11:00");
        setMinimumStay(String(h.minimum_stay || 1));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const res = await apiFetch("/api/owner/business-settings", {
        method: "PUT",
        body: JSON.stringify({
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          minimum_stay: minimumStay,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Schedule settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </DashboardShell>
    );
  }

  if (hostelStatus !== "APPROVED") {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hostel Not Approved</h2>
            <p className="text-gray-500 text-sm">You can only manage schedule after your hostel is approved.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule & Timing</h1>
        <p className="text-gray-500 mt-1">Configure check-in/check-out times and minimum stay requirements.</p>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Check-in/Check-out */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Check-in & Check-out Times</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Check-in Time</h4>
                    <p className="text-xs text-emerald-600">When guests can start checking in</p>
                  </div>
                </div>
                <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={ic + " bg-white"} />
              </div>
              <div className="bg-red-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Check-out Time</h4>
                    <p className="text-xs text-red-600">When guests should check out</p>
                  </div>
                </div>
                <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className={ic + " bg-white"} />
              </div>
            </div>
          </div>
        </div>

        {/* Minimum Stay */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Minimum Stay Requirement</h3>
          </div>
          <div className="p-6">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stay (days)</label>
              <input type="number" min="1" max="365" value={minimumStay} onChange={(e) => setMinimumStay(e.target.value)} className={ic} />
              <p className="text-[10px] text-gray-400 mt-1">Minimum number of days a guest must book</p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
