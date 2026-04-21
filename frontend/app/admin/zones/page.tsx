"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";
import Script from "next/script";

const sidebarItems = getSidebarItems();

declare global { interface Window { google: any; } }

interface Zone {
  id: number;
  name: string;
  display_name: string | null;
  status: number;
  is_default: number;
  hostels_count: number;
  minimum_service_charge: number | null;
  per_km_service_charge: number | null;
  coordinates: string | null;
  created_at: string;
}

export default function ZonesPage() {
  const router = useRouter();
  // Zone list state
  const [zones, setZones] = useState<Zone[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [coordinates, setCoordinates] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Map state
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const lastPolygonRef = useRef<any>(null);
  const mapInitDone = useRef(false);
  const overlayPolygonsRef = useRef<any[]>([]);

  // Warning modal
  const [showWarning, setShowWarning] = useState(false);
  const [newZoneId, setNewZoneId] = useState<number | null>(null);

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/zones${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (res.success) setZones(res.data);
    } catch { /* ignore */ } finally { setListLoading(false); }
  }, [search]);

  // Fetch map key on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/settings/map`).then((r) => r.json());
        if (res.success && res.data?.mapApiKeyClient) setMapApiKey(res.data.mapApiKeyClient);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // ---- Overlay existing zones on the map ----
  const loadExistingZoneOverlays = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    // Clear old overlays
    overlayPolygonsRef.current.forEach((p) => p.setMap(null));
    overlayPolygonsRef.current = [];

    try {
      const res = await apiFetch("/api/zones/coordinates");
      if (res.success) {
        res.data.forEach((z: any) => {
          if (z.coordinates?.length > 0) {
            const poly = new window.google.maps.Polygon({
              paths: z.coordinates.map((c: number[]) => ({ lat: c[0], lng: c[1] })),
              strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2,
              fillColor: "#FF0000", fillOpacity: 0.1,
              map: mapInstanceRef.current,
            });
            overlayPolygonsRef.current.push(poly);
          }
        });
      }
    } catch { /* ignore */ }
  }, []);

  // ---- Initialize Google Map ----
  const initMap = useCallback(() => {
    if (!window.google || !mapRef.current || mapInitDone.current) return;
    mapInitDone.current = true;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 17.385, lng: 78.4867 },
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
    });
    mapInstanceRef.current = map;

    // Drawing Manager
    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: { editable: true },
    });
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    window.google.maps.event.addListener(drawingManager, "overlaycomplete", (event: any) => {
      // Remove previous polygon completely
      if (lastPolygonRef.current) {
        lastPolygonRef.current.setEditable(false);
        lastPolygonRef.current.setMap(null);
        lastPolygonRef.current = null;
      }
      const path = event.overlay.getPath().getArray();
      setCoordinates(path.map((p: any) => `(${p.lat()}, ${p.lng()})`).join(", "));
      lastPolygonRef.current = event.overlay;
    });

    // Map search box
    const input = document.getElementById("zone-map-search") as HTMLInputElement;
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);
      map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || !places.length) return;
        const bounds = new window.google.maps.LatLngBounds();
        places.forEach((p: any) => {
          if (p.geometry?.viewport) bounds.union(p.geometry.viewport);
          else if (p.geometry?.location) bounds.extend(p.geometry.location);
        });
        map.fitBounds(bounds);
      });
    }

    // Show existing zones
    loadExistingZoneOverlays();

    // Geolocate
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [loadExistingZoneOverlays]);

  // Trigger init when script loads
  useEffect(() => {
    if (mapReady && window.google) {
      const t = setTimeout(() => initMap(), 150);
      return () => clearTimeout(t);
    }
  }, [mapReady, initMap]);

  // Handle google already loaded (client-side navigation back to this page)
  useEffect(() => {
    if (window.google && !mapInitDone.current && mapApiKey) {
      setMapReady(true);
    }
  }, [mapApiKey]);

  // ---- Handle create zone ----
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) { setFormError("Zone name is required"); return; }
    if (!coordinates) { setFormError("Please draw a zone area on the map"); return; }

    setSaving(true);
    try {
      const pairs = coordinates.match(/\(([^)]+)\)/g);
      if (!pairs || pairs.length < 3) { setFormError("At least 3 polygon points required"); setSaving(false); return; }
      const coordsArray = pairs.map((p) => {
        const nums = p.replace(/[()]/g, "").split(",").map((s) => parseFloat(s.trim()));
        return [nums[0], nums[1]];
      });

      const res = await apiFetch("/api/zones", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), displayName: displayName.trim() || null, coordinates: JSON.stringify(coordsArray) }),
      });

      if (res.success) {
        // Reset form
        setName("");
        setDisplayName("");
        setCoordinates("");
        setFormError("");

        // Remove drawn polygon completely from map
        if (lastPolygonRef.current) {
          lastPolygonRef.current.setEditable(false);
          lastPolygonRef.current.setMap(null);
          lastPolygonRef.current = null;
        }

        // Reset drawing manager back to polygon mode so user can draw again
        if (drawingManagerRef.current && window.google) {
          drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        }

        // Refresh overlays on the map
        loadExistingZoneOverlays();

        // Refresh table
        fetchZones();

        // Show warning modal
        setNewZoneId(res.data.id);
        setShowWarning(true);
      } else {
        setFormError(res.message || "Failed to create zone");
      }
    } catch { setFormError("Network error"); } finally { setSaving(false); }
  };

  const handleReset = () => {
    setName(""); setDisplayName(""); setCoordinates(""); setFormError("");
    if (lastPolygonRef.current) {
      lastPolygonRef.current.setEditable(false);
      lastPolygonRef.current.setMap(null);
      lastPolygonRef.current = null;
    }
    if (drawingManagerRef.current && window.google) {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/zones/${id}`, { method: "DELETE" });
      if (res.success) {
        fetchZones();
        loadExistingZoneOverlays();
      }
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const toggleStatus = async (id: number, current: number) => {
    try {
      const res = await apiFetch(`/api/zones/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: !current }) });
      if (res.success) fetchZones();
    } catch { /* ignore */ }
  };

  const setDefaultZone = async (id: number) => {
    try {
      const res = await apiFetch(`/api/zones/${id}/default`, { method: "PATCH" });
      if (res.success) fetchZones();
    } catch { /* ignore */ }
  };

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Add New Business Zone
        </h1>
      </div>

      {/* ====== CREATE FORM SECTION ====== */}
      <div ref={mapContainerRef} className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <form onSubmit={handleCreate}>
          <div className="flex flex-col lg:flex-row" style={{ height: "500px" }}>
            {/* Left — Instructions + Form */}
            <div className="lg:w-5/12 p-5 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto">
              <h6 className="text-sm font-semibold text-gray-800 mb-2">Instructions</h6>
              <p className="text-xs text-gray-500 mb-3">Create &amp; connect dots in a specific area on the map to add a new business zone.</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                  </span>
                  <p className="text-xs text-gray-600">Use this &lsquo;Hand Tool&rsquo; to find your target zone.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>
                  </span>
                  <p className="text-xs text-gray-600">Use this &lsquo;Shape Tool&rsquo; to point out the areas and connect the dots. A minimum of 3 points is required.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Zone Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Type new zone name here" maxLength={191}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Zone Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Write a new display zone name" maxLength={255}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400" />
                </div>
              </div>

              {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
              {coordinates && (
                <p className="mt-2 text-xs text-green-700">✅ Zone area drawn ({coordinates.match(/\(/g)?.length || 0} points)</p>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50">
                  Reset
                </button>
                <button type="submit" disabled={saving || !coordinates}
                  className={`px-4 py-2 rounded text-xs font-medium ${coordinates ? "bg-gray-800 text-white hover:bg-gray-900" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                  {saving ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>

            {/* Right — Map */}
            <div className="lg:w-7/12 relative">
              {!mapApiKey ? (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <div>
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    <p className="text-sm font-medium text-gray-500">Map API Key Required</p>
                    <p className="text-xs text-gray-400 mt-1">Add your Google Maps API key in <a href="/admin/settings" className="underline">System Settings</a></p>
                  </div>
                </div>
              ) : (
                <>
                  <input id="zone-map-search" type="text" placeholder="Search here"
                    className="absolute top-2 left-2 z-10 w-64 px-3 py-1.5 border border-gray-300 rounded text-sm shadow bg-white focus:outline-none" />
                  <div ref={mapRef} className="w-full h-full" />
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ====== ZONE LIST TABLE ====== */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Card Header */}
        <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <h5 className="text-sm font-semibold text-gray-800">
            Zone List
            <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {zones.length}
            </span>
          </h5>

          <form onSubmit={(e) => { e.preventDefault(); fetchZones(); }} className="ml-auto flex">
            <div className="flex">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name" className="px-3 py-1.5 border border-gray-300 border-r-0 rounded-l text-sm focus:outline-none" />
              <button type="submit" className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-r text-gray-500 hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {listLoading ? (
            <div className="text-center py-10">
              <svg className="animate-spin h-6 w-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm text-gray-400">No data found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">SL</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2.5">Zone ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 pl-8">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 pl-8">Display Name</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2.5">Hostels</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2.5">Default Status</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2.5">Status</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2.5" style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone, idx) => (
                  <tr key={zone.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{zone.id}</td>
                    <td className="px-4 py-3 pl-8 text-sm text-gray-800">{zone.name}</td>
                    <td className="px-4 py-3 pl-8 text-sm text-gray-600">{zone.display_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{zone.hostels_count || 0}</td>
                    <td className="px-4 py-3 text-center">
                      {zone.is_default ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          Default Zone
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                      ) : (
                        <button onClick={() => setDefaultZone(zone.id)}
                          className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50">
                          Make Default
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!zone.status} onChange={() => toggleStatus(zone.id, zone.status)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-800"></div>
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => router.push(`/admin/zones/${zone.id}/edit`)}
                          className="p-1.5 border border-gray-300 rounded hover:bg-gray-50" title="Edit Zone">
                          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => router.push(`/admin/zones/${zone.id}/settings`)}
                          className={`p-1.5 border rounded ${(!zone.minimum_service_charge || !zone.per_km_service_charge) ? "border-amber-400 bg-amber-50 hover:bg-amber-100" : "border-gray-300 hover:bg-gray-50"}`} title="Zone Settings">
                          <svg className={`w-3.5 h-3.5 ${(!zone.minimum_service_charge || !zone.per_km_service_charge) ? "text-amber-600" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(zone.id)} disabled={deleting === zone.id}
                          className="p-1.5 border border-gray-300 rounded hover:bg-red-50 hover:border-red-300" title="Delete">
                          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ====== WARNING MODAL ====== */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">New Business Zone Created Successfully!</h3>
                <p className="text-sm text-gray-600">
                  <strong>NEXT IMPORTANT STEP:</strong> You need to add &lsquo;Service Charge&rsquo; with other details from the Zone Settings. If you don&apos;t add a service charge, the Zone you created won&apos;t function properly.
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowWarning(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50">
                  I Will Do It Later
                </button>
                <button onClick={() => { setShowWarning(false); if (newZoneId) router.push(`/admin/zones/${newZoneId}/settings`); }}
                  className="px-4 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-900">
                  Go to Zone Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Script */}
      {mapApiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=drawing,places`}
          onLoad={() => setMapReady(true)}
          strategy="lazyOnload"
        />
      )}
    </DashboardShell>
  );
}
