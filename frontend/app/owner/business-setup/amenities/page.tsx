"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

const AMENITY_OPTIONS = [
  "WiFi", "Hot Water", "Laundry", "Parking", "Security", "CCTV", "Power Backup",
  "Gym", "Common Area", "Kitchen", "Meals", "Housekeeping", "Lift", "Garden",
  "Study Room", "Recreation Room", "AC", "Fan", "Fridge", "TV",
];

export default function OwnerAmenitiesSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hostelStatus, setHostelStatus] = useState<string>("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

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
        setSelectedAmenities(Array.isArray(h.amenities) ? h.amenities : []);
        setCustomFields(h.custom_fields || {});
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
          amenities: selectedAmenities,
          custom_fields: customFields,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Amenities saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally { setSaving(false); }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
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
            <p className="text-gray-500 text-sm">You can only manage amenities after your hostel is approved.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Amenities Setup</h1>
        <p className="text-gray-500 mt-1">Select the amenities available at your hostel and add custom fields.</p>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Amenities */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Available Amenities</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select all amenities available at your hostel</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button key={amenity} onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      isSelected ? "bg-emerald-500" : "bg-gray-200"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {amenity}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-700">
                <strong>Selected: {selectedAmenities.length}</strong> amenities
              </p>
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Custom Fields</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add additional information about your hostel</p>
              </div>
              <button onClick={() => setCustomFields(prev => ({ ...prev, [`field_${Date.now()}`]: "" }))}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add Field
              </button>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {Object.entries(customFields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <input type="text" defaultValue={key.replace(/_/g, " ")} placeholder="Field name"
                  onBlur={(e) => {
                    const newKey = e.target.value.replace(/\s+/g, "_").toLowerCase();
                    if (newKey && newKey !== key) {
                      const newFields = { ...customFields };
                      delete newFields[key];
                      newFields[newKey] = value;
                      setCustomFields(newFields);
                    }
                  }}
                  className="w-1/3 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                <input type="text" value={value} placeholder="Value"
                  onChange={(e) => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                <button onClick={() => {
                  const newFields = { ...customFields };
                  delete newFields[key];
                  setCustomFields(newFields);
                }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {Object.keys(customFields).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No custom fields. Click &quot;Add Field&quot; to add one.</p>
            )}
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
