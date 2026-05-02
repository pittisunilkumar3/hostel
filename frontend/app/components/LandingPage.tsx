"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import { useCurrency } from "@/lib/useCurrency";
import { useEffect, useState, useRef, useCallback } from "react";
import { API_URL } from "@/lib/auth";
import PublicHeader from "@/app/components/PublicHeader";
import PublicFooter from "@/app/components/PublicFooter";
import Script from "next/script";

export default function LandingPage() {
  const site = useSiteSettings();
  const { fc, symbol } = useCurrency();
  const name = site.companyName || "Hostel Management";
  const [loginUrl, setLoginUrl] = useState("/login/user");
  const [registerUrl, setRegisterUrl] = useState("/register/customer");
  const [searchQuery, setSearchQuery] = useState("");
  const [zones, setZones] = useState<{ id: number; name: string; display_name: string | null; image: string | null; hostels_count: number }[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [promoBanner, setPromoBanner] = useState<{ title: string; image: string } | null>(null);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [detectedZone, setDetectedZone] = useState<{ id: number; name: string; display_name: string } | null>(null);
  const [publicHostels, setPublicHostels] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInitRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    const saved = localStorage.getItem("hostel_location");
    if (saved) { try { const p = JSON.parse(saved); if (p?.lat && p?.lng) { setUserLocation({ lat: p.lat, lng: p.lng }); setSelectedAddress(p.address || ""); if (p.zoneId) setActiveZoneId(String(p.zoneId)); if (p.zoneName) setDetectedZone({ id: p.zoneId, name: p.zoneName, display_name: p.zoneName }); setLocationReady(true); } } catch {} }
    fetch(`${API_URL}/api/settings/map`).then(r => r.json()).then(d => { if (d.success && d.data?.mapApiKeyClient) setMapApiKey(d.data.mapApiKeyClient); }).catch(() => {});
  }, []);

  const handleFindMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, maximumAge: 300000 }));
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserLocation({ lat, lng }); setMapCoords({ lat, lng });
      const geoRes = await fetch(`${API_URL}/api/zones/reverse-geocode?lat=${lat}&lng=${lng}`);
      const geoData = await geoRes.json();
      setSelectedAddress(geoData.success && geoData.data?.address ? geoData.data.address : `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      const detectRes = await fetch(`${API_URL}/api/zones/detect?lat=${lat}&lng=${lng}`);
      const detectData = await detectRes.json();
      const z = detectData.data;
      if (detectData.success && z?.detected) { setActiveZoneId(String(z.zone_id)); setDetectedZone({ id: z.zone_id, name: z.zone_name, display_name: z.display_name }); }
      localStorage.setItem("hostel_location", JSON.stringify({ lat, lng, address: selectedAddress, zoneId: z?.zone_id || "", zoneName: z?.display_name || z?.zone_name || "" }));
      setLocationReady(true);
    } catch { alert("Unable to get your location. Please enable location access or set manually."); }
    setLocating(false);
  };

  const confirmMapLocation = async () => {
    if (!mapCoords) return;
    const { lat, lng } = mapCoords;
    setUserLocation({ lat, lng });
    try { const r = await fetch(`${API_URL}/api/zones/reverse-geocode?lat=${lat}&lng=${lng}`); const d = await r.json(); if (d.success && d.data?.address) setSelectedAddress(d.data.address); } catch {}
    try { const r = await fetch(`${API_URL}/api/zones/detect?lat=${lat}&lng=${lng}`); const d = await r.json(); const z = d.data; if (d.success && z?.detected) { setActiveZoneId(String(z.zone_id)); setDetectedZone({ id: z.zone_id, name: z.zone_name, display_name: z.display_name }); localStorage.setItem("hostel_location", JSON.stringify({ lat, lng, address: selectedAddress, zoneId: z.zone_id, zoneName: z.display_name || z.zone_name })); } else { localStorage.setItem("hostel_location", JSON.stringify({ lat, lng, address: selectedAddress, zoneId: "", zoneName: "" })); } } catch {}
    setLocationReady(true);
  };

  const clearLocation = () => { localStorage.removeItem("hostel_location"); setLocationReady(false); setUserLocation(null); setSelectedAddress(""); setDetectedZone(null); setActiveZoneId(""); setSearchQuery(""); };

  const initLocationMap = useCallback(() => {
    if (!window.google || !mapContainerRef.current || mapInitRef.current) return;
    mapInitRef.current = true;
    const center = mapCoords || { lat: 17.385, lng: 78.4867 };
    const map = new window.google.maps.Map(mapContainerRef.current, { center, zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
    mapInstanceRef.current = map;
    const marker = new window.google.maps.Marker({ position: center, map, draggable: true });
    markerRef.current = marker; setMapCoords(center); setSelectedAddress("");
    marker.addListener("dragend", () => { const p = marker.getPosition(); if (p) setMapCoords({ lat: p.lat(), lng: p.lng() }); });
    map.addListener("click", (e: any) => { const p = e.latLng; marker.setPosition(p); setMapCoords({ lat: p.lat(), lng: p.lng() }); });
    const input = document.getElementById("loc-map-search") as HTMLInputElement;
    if (input) { const sb = new window.google.maps.places.SearchBox(input); map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input); sb.addListener("places_changed", () => { const places = sb.getPlaces(); if (!places?.length) return; const loc = places[0].geometry?.location; if (loc) { const lat = loc.lat(), lng = loc.lng(); map.setCenter({ lat, lng }); marker.setPosition({ lat, lng }); setMapCoords({ lat, lng }); setSelectedAddress(places[0].formatted_address || ""); } }); }
  }, [mapCoords]);

  useEffect(() => { if (mapReady && window.google) { const t = setTimeout(() => initLocationMap(), 150); return () => clearTimeout(t); } }, [mapReady, initLocationMap]);
  useEffect(() => { if (window.google?.maps && !mapInitRef.current && mapApiKey) setMapReady(true); }, [mapApiKey]);

  const loadHostels = async (zoneId?: string, search?: string) => {
    setSearchLoading(true);
    try { const p = new URLSearchParams(); if (zoneId) p.set("zone_id", zoneId); if (search) p.set("search", search); const qs = p.toString(); const r = await fetch(`${API_URL}/api/hostels/public${qs ? `?${qs}` : ""}`); const d = await r.json(); setPublicHostels(d.success && d.data?.hostels ? d.data.hostels : []); } catch { setPublicHostels([]); }
    setSearchLoading(false);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) { setActiveZoneId(""); setDetectedZone(null); await loadHostels(detectedZone ? String(detectedZone.id) : ""); return; }
    const mz = zones.find(z => (z.display_name || z.name).toLowerCase() === q.toLowerCase() || z.name.toLowerCase() === q.toLowerCase());
    if (mz) { setActiveZoneId(String(mz.id)); setDetectedZone({ id: mz.id, name: mz.name, display_name: mz.display_name || mz.name }); await loadHostels(String(mz.id)); }
    else { setActiveZoneId(""); setDetectedZone(null); await loadHostels("", q); }
  };

  const handleCityClick = async (zone: { id: number; name: string; display_name: string | null }) => {
    const dn = zone.display_name || zone.name;
    setSearchQuery(dn); setActiveZoneId(String(zone.id)); setDetectedZone({ id: zone.id, name: zone.name, display_name: dn }); await loadHostels(String(zone.id));
  };

  useEffect(() => { (async () => { try { const r = await fetch(`${API_URL}/api/settings/login-url-public`); const d = await r.json(); if (d.success && d.data?.customer_login_url) setLoginUrl(`/login/${d.data.customer_login_url}`); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { const r = await fetch(`${API_URL}/api/zones`); const d = await r.json(); if (d.success && d.data) setZones(d.data.filter((z: any) => z.status === 1)); } catch {} })(); }, []);

  useEffect(() => {
    if (!locationReady) return;
    (async () => {
      const zp = activeZoneId ? `?zone_id=${activeZoneId}` : "";
      const [aR, bR, pR, hR] = await Promise.all([fetch(`${API_URL}/api/advertisements/list${zp}`), fetch(`${API_URL}/api/banners/public${zp}`), fetch(`${API_URL}/api/banners/promotional-public`), fetch(`${API_URL}/api/hostels/public${zp}`)]);
      try { const d = await aR.json(); if (d.success && d.data) setAds(Array.isArray(d.data) ? d.data : []); } catch {}
      try { const d = await bR.json(); if (d.success && d.data) setBanners(d.data); } catch {}
      try { const d = await pR.json(); if (d.success && d.data?.image) setPromoBanner(d.data); } catch {}
      try { const d = await hR.json(); if (d.success && d.data?.hostels) setPublicHostels(d.data.hostels); } catch {}
    })();
  }, [locationReady, activeZoneId]);

  useEffect(() => { if (banners.length <= 1) return; const t = setInterval(() => setActiveBannerIdx(p => (p + 1) % banners.length), 4500); return () => clearInterval(t); }, [banners.length]);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* ══════════════ LOCATION SETUP ══════════════ */}
      {!locationReady ? (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10 max-w-lg mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Discover hostels near you
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
              Find & Book <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Hostels</span> Near You
            </h1>
            <p className="text-slate-400 text-base mb-8 max-w-md mx-auto">Set your location to discover the best hostels and deals around you</p>

            <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <button onClick={handleFindMyLocation} disabled={locating}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold text-base hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-60 mb-5">
                {locating ? <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" /></svg>}
                {locating ? "Detecting your location..." : "📍 Find My Location"}
              </button>

              <div className="flex items-center gap-4 mb-5"><div className="flex-1 h-px bg-white/10" /><span className="text-xs text-slate-500 uppercase tracking-wider">or</span><div className="flex-1 h-px bg-white/10" /></div>

              {mapApiKey ? (
                <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                  <div className="relative" style={{ height: "260px" }}>
                    <input id="loc-map-search" type="text" placeholder="Search area..." className="absolute top-3 left-3 z-10 w-56 px-3 py-2 bg-white/95 border-0 rounded-xl text-sm shadow-lg focus:outline-none" />
                    <div ref={mapContainerRef} className="w-full h-full bg-slate-800" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5">
                    <p className="text-xs text-slate-400 truncate max-w-[60%]">{mapCoords ? (selectedAddress || `${mapCoords.lat.toFixed(4)}, ${mapCoords.lng.toFixed(4)}`) : "Drag the marker to set location"}</p>
                    <button onClick={confirmMapLocation} disabled={!mapCoords} className="px-5 py-2 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all disabled:opacity-40">Set Location</button>
                  </div>
                </div>
              ) : (
                <div className="h-40 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 text-sm mb-4">Loading map…</div>
              )}

              <button onClick={() => setLocationReady(true)} className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-all">Skip — Show all hostels →</button>
            </div>
          </div>
          {mapApiKey && <Script src={`https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`} onLoad={() => setMapReady(true)} strategy="lazyOnload" />}
        </section>
      ) : (
      <>

      {/* ══════════════ LOCATION BAR ══════════════ */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          </div>
          <span className="text-slate-400 shrink-0">Delivering to:</span>
          <span className="font-medium truncate">{selectedAddress || "All Areas"}</span>
          {detectedZone && <span className="text-emerald-400 text-xs font-medium shrink-0">• {detectedZone.display_name}</span>}
        </div>
        <button onClick={clearLocation} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold shrink-0 ml-3">Change</button>
      </div>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Animated bg */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-teal-900/30" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {publicHostels.length > 0 ? `${publicHostels.length}+ hostels available` : "Find your perfect stay"}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              Find & Book <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Hostels</span> Near You
            </h1>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Discover affordable hostels across India. Book rooms, beds, and dorms at the best prices.
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 p-3">
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Search by city, locality, or hostel name…" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-sm" />
                </div>
                <button onClick={handleSearch} disabled={searchLoading}
                  className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap">
                  {searchLoading ? <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Search</>}
                </button>
              </div>
            </div>

            {/* Quick links */}
            {zones.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <span className="text-slate-500 text-xs font-medium mr-1">Popular:</span>
                {zones.slice(0, 7).map(z => (
                  <button key={z.id} onClick={() => handleCityClick(z)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeZoneId === String(z.id) ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"}`}>
                    {z.display_name || z.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white" /></svg>
        </div>
      </section>

      {/* ══════════════ STATS STRIP ══════════════ */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[{ v: "10K+", l: "Hostels", e: "🏨" }, { v: "50K+", l: "Happy Guests", e: "😊" }, { v: "100+", l: "Cities", e: "📍" }, { v: "4.8★", l: "Avg Rating", e: "⭐" }].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl">{s.e}</span>
              <div><div className="text-xl font-extrabold text-gray-900">{s.v}</div><div className="text-xs text-gray-500">{s.l}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ PROMO BANNER ══════════════ */}
      {promoBanner?.image && (
        <section className="py-6 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4"><div className="relative rounded-2xl overflow-hidden group cursor-pointer"><img src={promoBanner.image} alt={promoBanner.title || "Offer"} className="w-full h-auto max-h-44 object-cover group-hover:scale-105 transition-transform duration-500" />{promoBanner.title && <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center pl-8"><h3 className="text-white text-2xl font-extrabold">{promoBanner.title}</h3></div>}</div></div>
        </section>
      )}

      {/* ══════════════ BANNER CAROUSEL ══════════════ */}
      {banners.length > 0 && (
        <section className="py-2 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <div className="relative aspect-[4/1] md:aspect-[5/1]">
                {banners.map((b, i) => <div key={b.id} className={`absolute inset-0 transition-opacity duration-700 ${i === activeBannerIdx ? "opacity-100" : "opacity-0"}`}><img src={b.image} alt={b.title} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" /><div className="absolute bottom-4 left-6"><h3 className="text-white text-lg font-bold drop-shadow">{b.title}</h3></div></div>)}
              </div>
              {banners.length > 1 && <div className="absolute bottom-3 right-4 flex gap-1.5">{banners.map((_, i) => <button key={i} onClick={() => setActiveBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === activeBannerIdx ? "bg-white w-6" : "bg-white/40 w-1.5"}`} />)}</div>}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ OFFERS / ADS ══════════════ */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-gray-900">Offers For You</h2></div>
          </div>
          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ads.map(ad => (
                <div key={ad.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer">
                  {ad.add_type === "video_promotion" && ad.video_attachment ? (
                    <><div className="relative aspect-video bg-black"><video src={ad.video_attachment} poster={ad.cover_image || undefined} controls muted loop className="w-full h-full object-cover" /><div className="absolute top-3 left-3"><span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg shadow flex items-center gap-1">▶ Video</span></div></div>
                    <div className="p-4"><h3 className="font-bold text-gray-900 group-hover:text-emerald-600">{ad.title}</h3>{ad.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>}</div></>
                  ) : (
                    <><div className="relative h-48 overflow-hidden">{ad.cover_image ? <img src={ad.cover_image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : ad.profile_image ? <img src={ad.profile_image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center"><span className="text-5xl opacity-30">🏷️</span></div>}<div className="absolute top-3 left-3"><span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow">Sponsored</span></div></div>
                    <div className="p-4"><h3 className="font-bold text-gray-900 group-hover:text-emerald-600">{ad.title}</h3>{ad.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>}</div></>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[{ t: "Flat 60% OFF", s: "On first booking", c: "WELCOME60", g: "from-rose-500 to-orange-500" }, { t: `${fc(200)} OFF`, s: `On hostels above ${fc(999)}`, c: "SAVE200", g: "from-violet-500 to-purple-600" }, { t: "Weekend Special", s: "Extra 30% OFF", c: "WEEKEND30", g: "from-emerald-500 to-teal-500" }].map((o, i) => (
                <div key={i} className={`bg-gradient-to-br ${o.g} rounded-2xl p-6 text-white cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}>
                  <div className="text-2xl font-extrabold mb-1">{o.t}</div>
                  <div className="text-white/80 text-sm mb-3">{o.s}</div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5"><span className="text-[10px]">Code:</span><span className="text-sm font-bold">{o.c}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ EXPLORE CITIES ══════════════ */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Explore Popular Cities</h2>
            <p className="text-gray-500 text-sm mt-1">Browse hostels in top destinations</p>
          </div>
          {zones.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {zones.map(z => (
                <button key={z.id} onClick={() => handleCityClick(z)}
                  className={`relative rounded-2xl overflow-hidden group cursor-pointer aspect-[4/3] transition-all hover:-translate-y-1 hover:shadow-xl ${activeZoneId === String(z.id) ? "ring-3 ring-emerald-400 ring-offset-2 shadow-xl -translate-y-1" : ""}`}>
                  {z.image ? <img src={z.image} alt={z.display_name || z.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"><span className="text-4xl font-extrabold text-white/70">{(z.display_name || z.name).charAt(0)}</span></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                    <span className="text-white font-bold text-base block">{z.display_name || z.name}</span>
                    <span className="text-white/70 text-xs">{z.hostels_count || 0} properties</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════ FEATURED HOSTELS ══════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {detectedZone ? `Hostels in ${detectedZone.display_name}` : searchQuery ? `Results for "${searchQuery}"` : "Featured Hostels"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{searchLoading ? "Searching…" : `${publicHostels.length} hostel${publicHostels.length !== 1 ? "s" : ""} found`}</p>
            </div>
            {(activeZoneId || searchQuery) && (
              <button onClick={() => { setActiveZoneId(""); setDetectedZone(null); setSearchQuery(""); loadHostels(); }} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Clear
              </button>
            )}
          </div>

          {searchLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : publicHostels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicHostels.map(h => (
                <Link key={h.id} href={`/hostels/${h.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group block">
                  <div className="relative h-52 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
                    {h.cover_photo ? <img src={h.cover_photo} alt={h.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : h.logo ? <img src={h.logo} alt={h.name} className="w-full h-full object-contain p-6" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-20">🏨</span></div>}
                    {h.zone_name && <div className="absolute top-3 left-3"><span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg">{h.zone_name}</span></div>}
                    {userLocation && h.latitude && h.longitude && (() => { const km = getDistance(userLocation.lat, userLocation.lng, +h.latitude, +h.longitude); return <div className="absolute top-3 right-3"><span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold rounded-lg shadow flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>{km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`}</span></div>; })()}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-emerald-600 transition-colors mb-1">{h.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg><span className="truncate">{h.address || h.zone_name || "India"}</span></p>
                    {h.amenities && <div className="flex flex-wrap gap-1 mt-2.5">{(JSON.parse(h.amenities || "[]")).slice(0, 3).map((a: string, i: number) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md">{a}</span>)}{(JSON.parse(h.amenities || "[]")).length > 3 && <span className="px-2 py-0.5 text-gray-400 text-[10px]">+{(JSON.parse(h.amenities || "[]")).length - 3}</span>}</div>}
                    <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                      <div>{h.min_price && h.min_price < 999999 ? <><span className="text-[10px] text-gray-400 block">Starting from</span><span className="text-xl font-extrabold text-emerald-700">{fc(h.min_price)}</span><span className="text-xs text-gray-400">/night</span></> : <span className="text-xs text-gray-500">View for prices</span>}</div>
                      <span className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm">View Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : activeZoneId || searchQuery ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
              <h3 className="text-gray-700 font-bold text-lg mb-1">No hostels found</h3>
              <p className="text-gray-400 text-sm mb-5">{searchQuery ? `No results for "${searchQuery}"` : `No hostels in ${detectedZone?.display_name || "this area"} yet`}</p>
              <button onClick={() => { setActiveZoneId(""); setDetectedZone(null); setSearchQuery(""); loadHostels(); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all">View All Hostels</button>
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════ WHY CHOOSE US ══════════════ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8"><h2 className="text-xl md:text-2xl font-bold text-gray-900">Why Book With {name}?</h2><p className="text-gray-500 text-sm mt-1">Trusted by thousands of travelers</p></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[{ i: "💰", t: "Lowest Prices", d: "Best prices guaranteed" }, { i: "✅", t: "Verified Properties", d: "All hostels verified & safe" }, { i: "📞", t: "24/7 Support", d: "Round the clock help" }, { i: "🔄", t: "Free Cancellation", d: "Cancel anytime, full refund" }].map((x, j) => (
              <div key={j} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all group border border-gray-100">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:bg-emerald-100 transition-colors">{x.i}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{x.t}</h3>
                <p className="text-xs text-gray-500">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-teal-600/10 rounded-full blur-[100px]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Ready to Find Your Perfect Stay?</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xl mx-auto">Join thousands of travelers who trust {name} for affordable, safe, and verified hostel bookings.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={registerUrl} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/30">Get Started Free</Link>
            <Link href={loginUrl} className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-all">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8"><h2 className="text-xl md:text-2xl font-bold text-gray-900">What Our Customers Say</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{ n: "Rahul Sharma", l: "Mumbai", r: 5, t: "Best hostel booking experience! Found a great place in Goa at half the price." }, { n: "Priya Patel", l: "Delhi", r: 5, t: `Clean rooms, friendly staff, and amazing locations. ${name} made my trip so much easier.` }, { n: "Amit Kumar", l: "Bangalore", r: 4, t: "Great for budget travelers. The filters help find exactly what you need!" }].map((x, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, j) => <svg key={j} className={`w-4 h-4 ${j < x.r ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{x.t}&rdquo;</p>
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{x.n[0]}</div><div><div className="font-semibold text-gray-900 text-sm">{x.n}</div><div className="text-xs text-gray-500">{x.l}</div></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ NEWSLETTER ══════════════ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Stay Updated</h2>
          <p className="text-gray-500 text-sm mb-5">Get exclusive deals and travel tips delivered to your inbox.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Enter your email" className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
            <button className="px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/25 whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </section>

      <PublicFooter />
      </>
      )}
    </div>
  );
}
