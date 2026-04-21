"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";
import Script from "next/script";

const sidebarItems = getSidebarItems();

declare global { interface Window { google: any; } }

export default function CreateZonePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [coordinates, setCoordinates] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapApiKey, setMapApiKey] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const lastPolygonRef = useRef<any>(null);
  const otherZonesRef = useRef<any[]>([]);

  // Fetch map API key and other zone polygons
  useEffect(() => {
    (async () => {
      try {
        const [mapRes, coordsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/settings/map`).then((r) => r.json()),
          apiFetch("/api/zones/coordinates").catch(() => ({ success: false, data: [] })),
        ]);
        if (mapRes.success && mapRes.data?.mapApiKeyClient) {
          setMapApiKey(mapRes.data.mapApiKeyClient);
        }
        if (coordsRes.success) otherZonesRef.current = coordsRes.data;
      } catch { /* ignore */ }
    })();
  }, []);

  const initMap = useCallback(() => {
    if (!window.google || !mapRef.current || mapInstanceRef.current) return;

    const defaultLat = 17.3850;
    const defaultLng = 78.4867;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
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
      polygonOptions: {
        editable: true,
        fillColor: "#4F46E5",
        fillOpacity: 0.15,
        strokeColor: "#4F46E5",
        strokeWeight: 2,
      },
    });
    drawingManager.setMap(map);

    window.google.maps.event.addListener(drawingManager, "overlaycomplete", (event: any) => {
      if (lastPolygonRef.current) lastPolygonRef.current.setMap(null);
      const path = event.overlay.getPath().getArray();
      const coordsStr = path.map((p: any) => `(${p.lat()}, ${p.lng()})`).join(", ");
      setCoordinates(coordsStr);
      lastPolygonRef.current = event.overlay;
    });

    // Search box
    const input = document.getElementById("zone-search-input") as HTMLInputElement;
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);
      map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        places.forEach((place: any) => {
          if (place.geometry?.viewport) bounds.union(place.geometry.viewport);
          else if (place.geometry?.location) bounds.extend(place.geometry.location);
        });
        map.fitBounds(bounds);
      });
    }

    // Show existing zones as red polygons
    otherZonesRef.current.forEach((z: any) => {
      if (z.coordinates && z.coordinates.length > 0) {
        const paths = z.coordinates.map((c: number[]) => ({ lat: c[0], lng: c[1] }));
        new window.google.maps.Polygon({
          paths,
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.1,
          map,
        });
      }
    });

    // Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && window.google) initMap();
  }, [mapLoaded, initMap]);

  const handleReset = () => {
    setName("");
    setDisplayName("");
    setCoordinates("");
    if (lastPolygonRef.current) {
      lastPolygonRef.current.setMap(null);
      lastPolygonRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Zone name is required"); return; }
    if (!coordinates) { setError("Please draw a zone area on the map (minimum 3 points)"); return; }

    setSaving(true);
    try {
      const pairs = coordinates.match(/\(([^)]+)\)/g);
      if (!pairs || pairs.length < 3) {
        setError("At least 3 polygon points are required");
        setSaving(false);
        return;
      }
      const coordsArray = pairs.map((p) => {
        const nums = p.replace(/[()]/g, "").split(",").map((s) => parseFloat(s.trim()));
        return [nums[0], nums[1]];
      });

      const res = await apiFetch("/api/zones", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          displayName: displayName.trim() || null,
          coordinates: JSON.stringify(coordsArray),
        }),
      });

      if (res.success) {
        if (confirm("Zone created! Do you want to configure the zone settings (service charges) now?")) {
          router.push(`/admin/zones/${res.data.id}/settings`);
        } else {
          router.push("/admin/zones");
        }
      } else {
        setError(res.message || "Failed to create zone");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/zones")} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Business Zone</h1>
            <p className="text-gray-500 text-sm">Draw the coverage area on the map to create a zone</p>
          </div>
        </div>
      </div>

      {!mapApiKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          <h3 className="text-lg font-bold text-amber-800 mb-2">Map API Key Required</h3>
          <p className="text-sm text-amber-700 mb-4">Please add your Google Maps API key in <a href="/admin/settings" className="font-semibold underline">System Settings → Map API Key</a> to use the zone drawing feature.</p>
          <a href="/admin/settings" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700">
            Go to Settings
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — Instructions & Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Instructions
                </h3>
                <p className="text-sm text-gray-600 mb-4">Create &amp; connect dots in a specific area on the map to add a new business zone.</p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Hand Tool</p>
                      <p className="text-xs text-blue-700">Use this to pan and find your target zone on the map.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Shape Tool</p>
                      <p className="text-xs text-indigo-700">Click points on the map to create a polygon. A minimum of 3 points is required.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">Red Zones</p>
                      <p className="text-xs text-red-700">Red polygons show existing zones. Your new zone will appear in indigo/blue.</p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name <span className="text-red-500">*</span></label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Hyderabad Central" maxLength={191}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Hyderabad City Center" maxLength={255}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                  </div>
                </div>

                {error && <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {coordinates && (
                  <div className="mt-4 p-3 bg-green-50 rounded-xl">
                    <p className="text-xs font-semibold text-green-700 mb-1">✅ Zone area drawn ({coordinates.match(/\(/g)?.length || 0} points)</p>
                    <p className="text-[10px] text-green-600 break-all">{coordinates}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={handleReset}
                    className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">Reset</button>
                  <button type="submit" disabled={saving || !coordinates}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                      coordinates ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}>
                    {saving ? (
                      <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating...</>
                    ) : "Submit"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right — Map */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Draw Zone on Map</span>
                  <span className="text-xs text-gray-400">Use the polygon tool to draw</span>
                </div>
                <div className="relative" style={{ height: "600px" }}>
                  <input id="zone-search-input" type="text" placeholder="Search location..."
                    className="absolute top-3 left-3 z-10 w-72 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  <div ref={mapRef} className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Google Maps Script — only loaded when API key is available */}
      {mapApiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=drawing,places`}
          onLoad={() => setMapLoaded(true)}
          strategy="lazyOnload"
        />
      )}
    </DashboardShell>
  );
}
