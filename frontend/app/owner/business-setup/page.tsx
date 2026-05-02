"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser, API_URL } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter } from "next/navigation";
import Script from "next/script";

const sidebarItems = getSidebarItems();

declare global { interface Window { google: any; } }

const ic = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all";

const AMENITY_OPTIONS = [
  "WiFi", "Hot Water", "Laundry", "Parking", "Security", "CCTV", "Power Backup",
  "Gym", "Common Area", "Kitchen", "Meals", "Housekeeping", "Lift", "Garden",
  "Study Room", "Recreation Room", "AC", "Fan", "Fridge", "TV",
];

export default function OwnerBusinessSetup() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hostelStatus, setHostelStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"basic" | "schedule" | "amenities">("basic");

  // Hostel state
  const [hostelName, setHostelName] = useState("");
  const [hostelAddress, setHostelAddress] = useState("");
  const [hostelPhone, setHostelPhone] = useState("");
  const [hostelEmail, setHostelEmail] = useState("");
  const [hostelDescription, setHostelDescription] = useState("");
  const [hostelLatitude, setHostelLatitude] = useState("");
  const [hostelLongitude, setHostelLongitude] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [hostelLogo, setHostelLogo] = useState("");
  const [hostelCover, setHostelCover] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [minimumStay, setMinimumStay] = useState("1");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Map state
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapReady, setMapReady] = useState(typeof window !== 'undefined' && !!(window as any).google?.maps);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInitDone = useRef(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/owner"); return; }
    setUser(u);
    fetchSettings();
    fetchMapKey();
  }, [router]);

  const fetchMapKey = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/map`).then((r) => r.json());
      if (res.success && res.data?.mapApiKeyClient) setMapApiKey(res.data.mapApiKeyClient);
    } catch { /* ignore */ }
  };

  // ---- Init map ----
  const initMap = useCallback(() => {
    if (!window.google || !mapRef.current || mapInitDone.current) return;
    mapInitDone.current = true;

    const lat = parseFloat(hostelLatitude) || 17.385;
    const lng = parseFloat(hostelLongitude) || 78.4867;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 13,
      mapTypeControl: false,
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
    });
    markerRef.current = marker;

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        setHostelLatitude(pos.lat().toFixed(6));
        setHostelLongitude(pos.lng().toFixed(6));
      }
    });

    const input = document.getElementById("owner-map-search") as HTMLInputElement;
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);
      map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || !places.length) return;
        const loc = places[0].geometry?.location;
        if (loc) {
          map.setCenter(loc);
          marker.setPosition(loc);
          setHostelLatitude(loc.lat().toFixed(6));
          setHostelLongitude(loc.lng().toFixed(6));
        }
      });
    }
  }, [hostelLatitude, hostelLongitude]);

  useEffect(() => {
    if (mapReady && window.google) {
      const t = setTimeout(() => initMap(), 150);
      return () => clearTimeout(t);
    }
  }, [mapReady, initMap]);

  useEffect(() => {
    if (window.google?.maps && !mapInitDone.current && !mapReady) {
      setMapReady(true);
    }
  }, [mapApiKey, mapReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !window.google) return;
    const lat = parseFloat(hostelLatitude);
    const lng = parseFloat(hostelLongitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const pos = { lat, lng };
      mapInstanceRef.current.setCenter(pos);
      markerRef.current.setPosition(pos);
    }
  }, [hostelLatitude, hostelLongitude]);

  useEffect(() => {
    return () => {
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
      if (mapInstanceRef.current) { mapInstanceRef.current = null; }
      mapInitDone.current = false;
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/owner/business-settings");
      if (res.success && res.data?.hostel) {
        const h = res.data.hostel;
        setHostelStatus(h.status || "");
        setHostelName(h.name || "");
        setHostelAddress(h.address || "");
        setHostelPhone(h.phone || "");
        setHostelEmail(h.email || "");
        setHostelDescription(h.description || "");
        setHostelLatitude(h.latitude ? String(h.latitude) : "");
        setHostelLongitude(h.longitude ? String(h.longitude) : "");
        setHostelLogo(h.logo || "");
        setHostelCover(h.cover_photo || "");
        setCheckInTime(h.check_in_time || "14:00");
        setCheckOutTime(h.check_out_time || "11:00");
        setMinimumStay(String(h.minimum_stay || 1));
        setSelectedAmenities(Array.isArray(h.amenities) ? h.amenities : []);
        setCustomFields(h.custom_fields || {});
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const uploadFile = async (file: File, type: "logo" | "cover"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/owner/business-settings/upload`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.data?.url) return data.data.url;
    return null;
  };

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      // Upload logo if changed
      let logoUrl = hostelLogo;
      if (logoFile) {
        setUploadingLogo(true);
        const uploaded = await uploadFile(logoFile, "logo");
        if (uploaded) logoUrl = uploaded;
        setUploadingLogo(false);
      }

      // Upload cover if changed
      let coverUrl = hostelCover;
      if (coverFile) {
        setUploadingCover(true);
        const uploaded = await uploadFile(coverFile, "cover");
        if (uploaded) coverUrl = uploaded;
        setUploadingCover(false);
      }

      const res = await apiFetch("/api/owner/business-settings", {
        method: "PUT",
        body: JSON.stringify({
          name: hostelName,
          address: hostelAddress,
          phone: hostelPhone,
          email: hostelEmail,
          description: hostelDescription,
          latitude: hostelLatitude,
          longitude: hostelLongitude,
          logo: logoUrl,
          cover_photo: coverUrl,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          minimum_stay: minimumStay,
          amenities: selectedAmenities,
          custom_fields: customFields,
        }),
      });

      if (res.success) {
        setMessage({ type: "success", text: "✅ Business settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save settings" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center cursor-pointer shrink-0">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className={`w-12 h-6 rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-gray-300"}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-6" : ""}`} />
      </div>
    </label>
  );

  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading business settings...</p>
        </div>
      </DashboardShell>
    );
  }

  if (hostelStatus !== "APPROVED") {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hostel Not Approved</h2>
            <p className="text-gray-500 text-sm">You can only manage business settings after your hostel is approved by the admin.</p>
            <button onClick={() => router.push("/owner/dashboard")} className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Setup</h1>
        <p className="text-gray-500 mt-1">Configure your hostel&apos;s basic information, schedule, and amenities.</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Business Configuration</h4>
          <p className="text-xs text-emerald-700 mt-0.5">Changes made here will be reflected on the customer-facing website and app. Keep your information up to date to attract more bookings.</p>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
        {[
          { id: "basic" as const, label: "Basic Setup", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { id: "schedule" as const, label: "Schedule & Timing", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
          { id: "amenities" as const, label: "Amenities", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-gray-600 hover:bg-gray-50"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* ============================================================ */}
      {/* BASIC SETUP TAB */}
      {/* ============================================================ */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Hostel Information</h3>
              <p className="text-xs text-gray-500 mt-0.5">This information appears on the customer website and app.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name <span className="text-red-500">*</span></label>
                <input type="text" value={hostelName} onChange={(e) => setHostelName(e.target.value)} placeholder="Enter hostel name" className={ic} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <input type="text" value={hostelAddress} onChange={(e) => setHostelAddress(e.target.value)} placeholder="Enter full address" className={ic} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={hostelPhone} onChange={(e) => setHostelPhone(e.target.value)} placeholder="+91 9876543210" className={ic} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={hostelEmail} onChange={(e) => setHostelEmail(e.target.value)} placeholder="info@hostel.com" className={ic} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="relative">
                  <textarea value={hostelDescription} onChange={(e) => setHostelDescription(e.target.value)} placeholder="Describe your hostel..." rows={4} className={ic + " resize-none"} />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{hostelDescription.length}/500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Location</h3>
              <p className="text-xs text-gray-500 mt-0.5">Set your hostel location for customers to find you easily.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="text" value={hostelLatitude} onChange={(e) => setHostelLatitude(e.target.value)} placeholder="12.971599" className={ic} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="text" value={hostelLongitude} onChange={(e) => setHostelLongitude(e.target.value)} placeholder="77.594566" className={ic} />
                </div>
              </div>
              <div className="border border-gray-300 rounded-xl h-52 relative bg-gray-50">
                {!mapApiKey ? (
                  <div className="flex items-center justify-center h-full text-center p-4">
                    <div>
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <p className="text-xs text-gray-400">Map API Key not configured</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input id="owner-map-search" type="text" placeholder="Search location..."
                      className="absolute top-2 left-2 z-10 w-64 px-3 py-1.5 border border-gray-300 rounded text-sm shadow bg-white focus:outline-none" />
                    <div ref={mapRef} className="w-full h-full" />
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-400">Drag the marker or search a location to set coordinates automatically</p>
            </div>
          </div>

          {/* Logo & Cover Photo */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Logo & Cover Photo</h3>
              <p className="text-xs text-gray-500 mt-0.5">Upload your hostel logo and cover photo.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                  {hostelLogo ? <img src={hostelLogo} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-2 rounded-lg" /> : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setLogoFile(f); setHostelLogo(URL.createObjectURL(f)); }
                  }} className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  <p className="text-[10px] text-gray-400 mt-2">Max 2 MB</p>
                  {uploadingLogo && <p className="text-[10px] text-emerald-600 mt-1 animate-pulse">Uploading...</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                  {hostelCover ? <img src={hostelCover} alt="Cover" className="w-full h-24 object-cover mx-auto mb-2 rounded-lg" /> : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setCoverFile(f); setHostelCover(URL.createObjectURL(f)); }
                  }} className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  <p className="text-[10px] text-gray-400 mt-2">Max 2 MB</p>
                  {uploadingCover && <p className="text-[10px] text-emerald-600 mt-1 animate-pulse">Uploading...</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving || uploadingLogo || uploadingCover}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30">
              {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCHEDULE & TIMING TAB */}
      {/* ============================================================ */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {/* Check-in/Check-out */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Check-in & Check-out Times</h3>
              <p className="text-xs text-gray-500 mt-0.5">Set the standard check-in and check-out times for your hostel.</p>
            </div>
            <div className="p-6 space-y-6">
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
              <h3 className="text-lg font-bold text-gray-900">Minimum Stay</h3>
              <p className="text-xs text-gray-500 mt-0.5">Set the minimum number of days a guest must book.</p>
            </div>
            <div className="p-6">
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stay (days)</label>
                <input type="number" min="1" max="365" value={minimumStay} onChange={(e) => setMinimumStay(e.target.value)} className={ic} />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30">
              {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AMENITIES TAB */}
      {/* ============================================================ */}
      {activeTab === "amenities" && (
        <div className="space-y-6">
          {/* Amenities Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Hostel Amenities</h3>
              <p className="text-xs text-gray-500 mt-0.5">Select the amenities available at your hostel. This helps guests know what to expect.</p>
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
                  {selectedAmenities.length > 0 && (
                    <span className="ml-2">({selectedAmenities.join(", ")})</span>
                  )}
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
                  <p className="text-xs text-gray-500 mt-0.5">These fields are configured by admin. You can edit the values only.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {Object.entries(customFields).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-1/3 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-medium">
                    {key.replace(/_/g, " ").replace(/field \d+/, "") || "Field"}
                  </div>
                  <input type="text" value={value} placeholder="Value"
                    onChange={(e) => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              ))}
              {Object.keys(customFields).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No custom fields added yet. Click &quot;Add Field&quot; to add one.</p>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30">
              {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Google Maps Script — only inject if not already loaded */}
      {mapApiKey && !mapReady && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`}
          onLoad={() => setMapReady(true)}
          strategy="lazyOnload"
        />
      )}
    </DashboardShell>
  );
}
