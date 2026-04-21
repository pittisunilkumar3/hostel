"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter, useParams } from "next/navigation";
import Script from "next/script";

const sidebarItems = getSidebarItems();

declare global { interface Window { google: any; } }

export default function EditZonePage() {
  const router = useRouter();
  const params = useParams();
  const zoneId = params.id as string;

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [coordinates, setCoordinates] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapApiKey, setMapApiKey] = useState("");
  const [zoneData, setZoneData] = useState<any>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const lastPolygonRef = useRef<any>(null);
  const otherZonesRef = useRef<any[]>([]);

  // Fetch zone data + map key + other zones
  useEffect(() => {
    (async () => {
      try {
        const [zoneRes, coordsRes, mapRes] = await Promise.all([
          apiFetch(`/api/zones/${zoneId}`),
          apiFetch(`/api/zones/coordinates?exclude=${zoneId}`).catch(() => ({ success: false, data: [] })),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/settings/map`).then((r) => r.json()),
        ]);
        if (zoneRes.success) {
          const z = zoneRes.data;
          setZoneData(z);
          setName(z.name);
          setDisplayName(z.display_name || "");
          if (z.coordinates) {
            try {
              const coords = JSON.parse(z.coordinates);
              const str = coords.map((c: number[]) => `(${c[0]}, ${c[1]})`).join(", ");
              setCoordinates(str);
            } catch { /* ignore */ }
          }
        }
        if (coordsRes.success) otherZonesRef.current = coordsRes.data;
        if (mapRes.success && mapRes.data?.mapApiKeyClient) {
          setMapApiKey(mapRes.data.mapApiKeyClient);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [zoneId]);

  const initMap = useCallback(() => {
    if (!window.google || !mapRef.current || mapInstanceRef.current) return;

    let center = { lat: 17.385, lng: 78.4867 };
    if (zoneData?.coordinates) {
      try {
        const coords = JSON.parse(zoneData.coordinates);
        if (coords.length > 0) {
          const avgLat = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
          const avgLng = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
          center = { lat: avgLat, lng: avgLng };
        }
      } catch { /* ignore */ }
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
    });
    mapInstanceRef.current = map;

    // Show existing zone polygon
    if (zoneData?.coordinates) {
      try {
        const coords = JSON.parse(zoneData.coordinates);
        if (coords.length > 0) {
          const paths = coords.map((c: number[]) => ({ lat: c[0], lng: c[1] }));
          new window.google.maps.Polygon({
            paths,
            strokeColor: "#4F46E5",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#4F46E5",
            fillOpacity: 0.15,
            map,
          });
          const bounds = new window.google.maps.LatLngBounds();
          paths.forEach((p: any) => bounds.extend(p));
          map.fitBounds(bounds);
        }
      } catch { /* ignore */ }
    }

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

    // Show other zones as red
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

    // Search
    const input = document.getElementById("zone-search-input") as HTMLInputElement;
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);
      map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        places.forEach((p: any) => {
          if (p.geometry?.viewport) bounds.union(p.geometry.viewport);
          else if (p.geometry?.location) bounds.extend(p.geometry.location);
        });
        map.fitBounds(bounds);
      });
    }
  }, [zoneData]);

  useEffect(() => {
    if (mapLoaded && window.google && zoneData) initMap();
  }, [mapLoaded, zoneData, initMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Zone name is required"); return; }
    if (!coordinates) { setError("Please draw a zone area on the map"); return; }

    setSaving(true);
    try {
      const pairs = coordinates.match(/\(([^)]+)\)/g);
      if (!pairs || pairs.length < 3) { setError("At least 3 points required"); setSaving(false); return; }
      const coordsArray = pairs.map((p) => {
        const nums = p.replace(/[()]/g, "").split(",").map((s) => parseFloat(s.trim()));
        return [nums[0], nums[1]];
      });

      const res = await apiFetch(`/api/zones/${zoneId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          displayName: displayName.trim() || null,
          coordinates: JSON.stringify(coordsArray),
        }),
      });
      if (res.success) router.push("/admin/zones");
      else setError(res.message || "Failed to update zone");
    } catch { setError("Network error"); } finally { setSaving(false); }
  };

  if (loading) return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>
    </DashboardShell>
  );

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/admin/zones")} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Zone: {zoneData?.name}</h1>
          <p className="text-gray-500 text-sm">Update the zone name and coverage area</p>
        </div>
      </div>

      {!mapApiKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          <h3 className="text-lg font-bold text-amber-800 mb-2">Map API Key Required</h3>
          <p className="text-sm text-amber-700 mb-4">Please add your Google Maps API key in <a href="/admin/settings" className="font-semibold underline">System Settings → Map API Key</a> to use the zone drawing feature.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name <span className="text-red-500">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={191}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={255}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
                {coordinates && (
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs font-semibold text-green-700">✅ Zone area ({coordinates.match(/\(/g)?.length || 0} points)</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => router.push("/admin/zones")} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
                    {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Updating...</> : "Update Zone"}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Edit Zone Area</span>
                  <span className="text-xs text-gray-400">Draw a new polygon to replace existing area</span>
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
