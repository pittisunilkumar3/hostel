"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter, useParams } from "next/navigation";

const sidebarItems = getSidebarItems();

export default function ZoneSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const zoneId = params.id as string;

  const [zone, setZone] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [minCharge, setMinCharge] = useState("");
  const [perKmCharge, setPerKmCharge] = useState("");
  const [maxCharge, setMaxCharge] = useState("");
  const [increasedFee, setIncreasedFee] = useState("");
  const [increasedFeeStatus, setIncreasedFeeStatus] = useState(false);
  const [increasedFeeMsg, setIncreasedFeeMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/zones/${zoneId}`);
        if (res.success) {
          const z = res.data;
          setZone(z);
          setMinCharge(z.minimum_service_charge ?? "");
          setPerKmCharge(z.per_km_service_charge ?? "");
          setMaxCharge(z.maximum_service_charge ?? "");
          setIncreasedFee(z.increased_service_fee ? String(z.increased_service_fee) : "");
          setIncreasedFeeStatus(!!z.increased_service_fee_status);
          setIncreasedFeeMsg(z.increase_service_charge_message || "");
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [zoneId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await apiFetch(`/api/zones/${zoneId}/settings`, {
        method: "PUT",
        body: JSON.stringify({
          minimumServiceCharge: minCharge ? parseFloat(minCharge) : null,
          perKmServiceCharge: perKmCharge ? parseFloat(perKmCharge) : null,
          maximumServiceCharge: maxCharge ? parseFloat(maxCharge) : null,
          increasedServiceFee: increasedFee ? parseFloat(increasedFee) : 0,
          increasedFeeStatus,
          increaseServiceChargeMessage: increasedFeeMsg || null,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Zone settings saved successfully!" });
        setZone(res.data);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>
    </DashboardShell>
  );

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/zones")} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Zone Settings: {zone?.name}</h1>
              <p className="text-gray-500 text-sm">Set zone-wise service charges for this business zone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if charges not set */}
      {(!zone?.minimum_service_charge || !zone?.per_km_service_charge) && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          <div className="text-sm text-amber-800">
            <strong>Important!</strong> The Business Zone will NOT work if you don&apos;t add the minimum service charge &amp; per km service charge.
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h3 className="text-base font-bold text-gray-900">Service Charges Settings</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Minimum Service Charge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Service Charge (₹)
                  <span className="text-gray-400 ml-1" title="Set the minimum service charge for each booking in this zone">ℹ️</span>
                </label>
                <input type="number" value={minCharge} onChange={(e) => setMinCharge(e.target.value)}
                  min="0" step="0.001" placeholder="e.g. 50" required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>

              {/* Per KM Service Charge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Charge Per KM (₹)
                  <span className="text-gray-400 ml-1" title="Set a service charge for each kilometer in this zone">ℹ️</span>
                </label>
                <input type="number" value={perKmCharge} onChange={(e) => setPerKmCharge(e.target.value)}
                  min="0" step="0.001" placeholder="e.g. 10" required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>

              {/* Maximum Service Charge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Service Charge (₹)
                  <span className="text-gray-400 ml-1" title="Set the maximum cap for total service charge. Leave empty for no limit.">ℹ️</span>
                </label>
                <input type="number" value={maxCharge} onChange={(e) => setMaxCharge(e.target.value)}
                  min="0" step="0.001" placeholder="e.g. 500"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>

              {/* Increased Service Fee */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Increased Service Charge (%)
                    <span className="text-gray-400 ml-1" title="Additional charge percentage for emergency situations">ℹ️</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button type="button" onClick={() => setIncreasedFeeStatus(!increasedFeeStatus)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${increasedFeeStatus ? "bg-indigo-600" : "bg-gray-200"}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${increasedFeeStatus ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    <span className="text-xs text-gray-500">Enable</span>
                  </label>
                </div>
                <input type="number" value={increasedFee} onChange={(e) => setIncreasedFee(e.target.value)}
                  min="0" step="0.001" placeholder="e.g. 15" disabled={!increasedFeeStatus}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-gray-50 disabled:text-gray-400" />
              </div>

              {/* Increased Fee Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Increased Charge Reason
                  <span className="text-gray-400 ml-1" title="Message shown to customers explaining the increased charge">ℹ️</span>
                </label>
                <input type="text" value={increasedFeeMsg} onChange={(e) => setIncreasedFeeMsg(e.target.value)}
                  placeholder="e.g. Peak season charges" disabled={!increasedFeeStatus}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
              <button type="button" onClick={() => {
                setMinCharge(zone?.minimum_service_charge ?? "");
                setPerKmCharge(zone?.per_km_service_charge ?? "");
                setMaxCharge(zone?.maximum_service_charge ?? "");
                setIncreasedFee(zone?.increased_service_fee ? String(zone.increased_service_fee) : "");
                setIncreasedFeeStatus(!!zone?.increased_service_fee_status);
                setIncreasedFeeMsg(zone?.increase_service_charge_message || "");
                setMessage(null);
              }} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">
                Reset
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                {saving ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}
