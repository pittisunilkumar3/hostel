"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";
import Script from "next/script";

const sidebarItems = getSidebarItems();

declare global { interface Window { google: any; } }

interface Zone {
  id: number;
  name: string;
  display_name: string | null;
}

export default function CreateHostelPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Basic Information (mirrors reference vendor/index.blade.php) ──
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [description, setDescription] = useState("");

  // ── Logo & Cover (mirrors reference image uploader) ──
  const [logo, setLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  // ── Location (mirrors reference map section) ──
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInitDone = useRef(false);

  // ── Owner Information (mirrors reference Owner_Info section) ──
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  // ── General Settings (mirrors reference General_Settings) ──
  const [totalRooms, setTotalRooms] = useState("");
  const [totalBeds, setTotalBeds] = useState("");
  const [minimumStay, setMinimumStay] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");

  // ── Amenities ──
  const [amenities, setAmenities] = useState<string[]>([]);
  const amenityOptions = [
    "WiFi", "Parking", "Kitchen", "Laundry", "AC", "Hot Water",
    "Security", "CCTV", "Lift", "Gym", "Common Area", "Terrace",
    "Meals", "Housekeeping", "Power Backup", "Water Purifier"
  ];

  // ── Custom Fields from Join Us Page Setup ──
  interface CustomField {
    name: string;
    label: string;
    type: "text" | "number" | "select" | "textarea" | "checkbox";
    required: boolean;
    options?: string[];
  }
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/zones");
        if (res.success) setZones(res.data || []);
      } catch { /* ignore */ }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/settings/map`).then((r) => r.json());
        if (res.success && res.data?.mapApiKeyClient) setMapApiKey(res.data.mapApiKeyClient);
      } catch { /* ignore */ }
      // Fetch custom fields from Join Us Page Setup
      try {
        const res = await apiFetch("/api/settings/join-us-fields");
        if (res.success && res.data) setCustomFields(res.data);
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Initialize Google Map ──
  const initMap = useCallback(() => {
    if (!window.google || !mapRef.current || mapInitDone.current) return;
    mapInitDone.current = true;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 17.385, lng: 78.4867 },
      zoom: 12,
      mapTypeControl: false,
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      map,
      draggable: true,
      position: { lat: 17.385, lng: 78.4867 },
    });
    markerRef.current = marker;

    const updatePos = (pos: any) => {
      setLatitude(pos.lat().toFixed(6));
      setLongitude(pos.lng().toFixed(6));
    };

    marker.addListener("dragend", () => updatePos(marker.getPosition()));
    map.addListener("click", (e: any) => {
      marker.setPosition(e.latLng);
      updatePos(e.latLng);
    });

    // Search box
    const input = document.getElementById("hostel-map-search") as HTMLInputElement;
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places?.length) {
          const place = places[0];
          if (place.geometry?.location) {
            map.setCenter(place.geometry.location);
            marker.setPosition(place.geometry.location);
            updatePos(place.geometry.location);
          }
        }
      });
    }

    updatePos(marker.getPosition());
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (mapApiKey && !mapInitDone.current) {
      if (window.google?.maps) {
        initMap();
      }
    }
  }, [mapApiKey, initMap]);

  // ── Image handlers ──
  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogo(result);
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCoverPhoto(result);
      setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    // Validation
    if (!name.trim() || !address.trim() || !zoneId || !ownerFirstName.trim() || !ownerLastName.trim() || !ownerPhone.trim() || !ownerEmail.trim()) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const body = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        zone_id: parseInt(zoneId),
        description: description.trim(),
        logo: logo || null,
        cover_photo: coverPhoto || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        owner: {
          f_name: ownerFirstName.trim(),
          l_name: ownerLastName.trim(),
          phone: ownerPhone.trim(),
          email: ownerEmail.trim(),
          password: ownerPassword || undefined,
        },
        general: {
          total_rooms: totalRooms ? parseInt(totalRooms) : 0,
          total_beds: totalBeds ? parseInt(totalBeds) : 0,
          minimum_stay: minimumStay ? parseInt(minimumStay) : 1,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
        },
        amenities,
        custom_fields: customFieldValues,
      };

      const res = await apiFetch("/api/hostels", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (res.success) {
        setMessage({ type: "success", text: "✅ Hostel created successfully!" });
        setTimeout(() => router.push("/admin/hostels"), 1500);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to create hostel" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {mapApiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places&callback=initHostelMap`}
          onReady={() => {
            (window as any).initHostelMap = initMap;
            if (window.google?.maps) initMap();
          }}
        />
      )}

      {/* Page Header — mirrors reference vendor/index.blade.php page-header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Hostel</h1>
        </div>
        <button
          onClick={() => router.push("/admin/hostels")}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Column: Basic Info + Map ── */}
        <div className="flex-1 space-y-5">

          {/* Basic Information — mirrors reference vendor/index.blade.php Basic Information card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-900">Basic Information</h3>
              <p className="text-xs text-gray-400 mt-0.5">Setup your hostel basic information here</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Hostel Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hostel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: ABC Hostel"
                  maxLength={191}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hostel Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: House#94, Road#8, Abc City"
                  maxLength={200}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none"
                />
              </div>

              {/* Zone + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  >
                    <option value="">Select Zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.display_name || z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+(880)00-000-00000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  />
                </div>
              </div>

              {/* Email + Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hostel@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description about hostel"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                  />
                </div>
              </div>

              {/* Map — mirrors reference map section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location on Map</label>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700">Set precise location on map for your exact pickup location</p>
                </div>
                <input
                  id="hostel-map-search"
                  type="text"
                  placeholder="Search location here..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all mb-3"
                />
                <div ref={mapRef} className="w-full h-[280px] rounded-xl border border-gray-200 bg-gray-100" />
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Lat:</label>
                    <input
                      type="text"
                      value={latitude}
                      readOnly
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Lng:</label>
                    <input
                      type="text"
                      value={longitude}
                      readOnly
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 w-28"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Logo + Cover ── */}
        <div className="w-full lg:w-80 space-y-5">
          {/* Logo — mirrors reference image uploader */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Hostel Logo <span className="text-red-500">*</span></h3>
              <p className="text-xs text-gray-400 mt-0.5">Upload hostel logo (1:1 ratio)</p>
            </div>
            <div className="p-6">
              <label htmlFor="logo-upload" className="cursor-pointer block">
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 transition-all overflow-hidden bg-gray-50 flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400">Click to upload logo</p>
                    </div>
                  )}
                </div>
              </label>
              <input type="file" id="logo-upload" accept="image/*" onChange={handleLogo} className="hidden" />
            </div>
          </div>

          {/* Cover Photo — mirrors reference image uploader */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Cover Photo <span className="text-red-500">*</span></h3>
              <p className="text-xs text-gray-400 mt-0.5">Upload cover photo (3:1 ratio)</p>
            </div>
            <div className="p-6">
              <label htmlFor="cover-upload" className="cursor-pointer block">
                <div className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 transition-all overflow-hidden bg-gray-50 flex items-center justify-center">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400">Click to upload cover</p>
                    </div>
                  )}
                </div>
              </label>
              <input type="file" id="cover-upload" accept="image/*" onChange={handleCover} className="hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* ── General Settings — mirrors reference General_Settings card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-base font-bold text-gray-900">General Settings</h3>
          <p className="text-xs text-gray-400 mt-0.5">Setup your hostel general settings from here</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Rooms</label>
              <input
                type="number"
                value={totalRooms}
                onChange={(e) => setTotalRooms(e.target.value)}
                placeholder="Ex: 20"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Beds</label>
              <input
                type="number"
                value={totalBeds}
                onChange={(e) => setTotalBeds(e.target.value)}
                placeholder="Ex: 50"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Stay (days)</label>
              <input
                type="number"
                value={minimumStay}
                onChange={(e) => setMinimumStay(e.target.value)}
                placeholder="Ex: 1"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in Time</label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out Time</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    amenities.includes(a)
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Custom Fields from Join Us Page Setup ── */}
      {customFields.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-base font-bold text-gray-900">Additional Information</h3>
            <p className="text-xs text-gray-400 mt-0.5">Custom fields configured in Join Us Page Setup</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customFields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={customFieldValues[field.name] || ""}
                      onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                      rows={3}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={customFieldValues[field.name] || ""}
                      onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                    >
                      <option value="">Select {field.label}</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`custom-${field.name}`}
                        checked={customFieldValues[field.name] === "true"}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.checked ? "true" : "" })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor={`custom-${field.name}`} className="text-sm text-gray-600">{field.label}</label>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={customFieldValues[field.name] || ""}
                      onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Owner Information — mirrors reference Owner_Info card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-base font-bold text-gray-900">Owner Information</h3>
          <p className="text-xs text-gray-400 mt-0.5">Setup owner personal information from here</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ownerFirstName}
                onChange={(e) => setOwnerFirstName(e.target.value)}
                placeholder="Ex: John"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                placeholder="Ex: Doe"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+(880)00-000-00000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="8+ characters"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">Must contain at least one number, one uppercase, one lowercase letter, and at least 8 characters.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit Button ── */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => router.push("/admin/hostels")}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
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
    </DashboardShell>
  );
}
