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
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
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

  // Location setup state
  const [locationReady, setLocationReady] = useState(false); // true once location confirmed
  const [locating, setLocating] = useState(false); // GPS spinner
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationPredictions, setLocationPredictions] = useState<{ place_id: string; description: string }[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInitRef = useRef(false);

  // Haversine distance in km
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Check localStorage for saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem("hostel_location");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lng && parsed?.address) {
          setUserLocation({ lat: parsed.lat, lng: parsed.lng });
          setSelectedAddress(parsed.address);
          if (parsed.zoneId) setActiveZoneId(String(parsed.zoneId));
          if (parsed.zoneName) setDetectedZone({ id: parsed.zoneId, name: parsed.zoneName, display_name: parsed.zoneName });
          setLocationReady(true);
        }
      } catch {}
    }
    // Fetch map key
    fetch(`${API_URL}/api/settings/map`).then(r => r.json()).then(d => {
      if (d.success && d.data?.mapApiKeyClient) setMapApiKey(d.data.mapApiKeyClient);
    }).catch(() => {});
  }, []);

  // Find My Location (GPS)
  const handleFindMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 300000 });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLocation({ lat, lng });
      setMapCoords({ lat, lng });

      // Reverse geocode
      const geoRes = await fetch(`${API_URL}/api/zones/reverse-geocode?lat=${lat}&lng=${lng}`);
      const geoData = await geoRes.json();
      const address = geoData.success && geoData.data?.address ? geoData.data.address : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSelectedAddress(address);

      // Detect zone
      const detectRes = await fetch(`${API_URL}/api/zones/detect?lat=${lat}&lng=${lng}`);
      const detectData = await detectRes.json();
      const z = detectData.data;
      if (detectData.success && z?.detected) {
        setActiveZoneId(String(z.zone_id));
        setDetectedZone({ id: z.zone_id, name: z.zone_name, display_name: z.display_name });
      }

      // Save to localStorage
      localStorage.setItem("hostel_location", JSON.stringify({
        lat, lng, address,
        zoneId: z?.zone_id || "", zoneName: z?.display_name || z?.zone_name || "",
      }));
      setLocationReady(true);
    } catch {
      alert("Unable to get your location. Please enable location access or set manually.");
    }
    setLocating(false);
  };

  // Confirm location from map
  const confirmMapLocation = async () => {
    if (!mapCoords) return;
    const { lat, lng } = mapCoords;
    setUserLocation({ lat, lng });

    // Reverse geocode
    try {
      const geoRes = await fetch(`${API_URL}/api/zones/reverse-geocode?lat=${lat}&lng=${lng}`);
      const geoData = await geoRes.json();
      const address = geoData.success && geoData.data?.address ? geoData.data.address : selectedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSelectedAddress(address);
    } catch {}

    // Detect zone
    try {
      const detectRes = await fetch(`${API_URL}/api/zones/detect?lat=${lat}&lng=${lng}`);
      const detectData = await detectRes.json();
      const z = detectData.data;
      if (detectData.success && z?.detected) {
        setActiveZoneId(String(z.zone_id));
        setDetectedZone({ id: z.zone_id, name: z.zone_name, display_name: z.display_name });
        localStorage.setItem("hostel_location", JSON.stringify({
          lat, lng, address: selectedAddress || "",
          zoneId: z.zone_id, zoneName: z.display_name || z.zone_name,
        }));
      } else {
        localStorage.setItem("hostel_location", JSON.stringify({
          lat, lng, address: selectedAddress || "",
          zoneId: "", zoneName: "",
        }));
      }
    } catch {}
    setLocationReady(true);
  };

  // Clear location
  const clearLocation = () => {
    localStorage.removeItem("hostel_location");
    setLocationReady(false);
    setUserLocation(null);
    setSelectedAddress("");
    setDetectedZone(null);
    setActiveZoneId("");
    setSearchQuery("");
  };

  // Initialize map for "Pick from Map"
  const initLocationMap = useCallback(() => {
    if (!window.google || !mapContainerRef.current || mapInitRef.current) return;
    mapInitRef.current = true;
    const center = mapCoords || { lat: 17.385, lng: 78.4867 };
    const map = new window.google.maps.Map(mapContainerRef.current, {
      center, zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    mapInstanceRef.current = map;
    const marker = new window.google.maps.Marker({ position: center, map, draggable: true });
    markerRef.current = marker;
    setMapCoords(center);
    setSelectedAddress("");

    // Drag end
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) setMapCoords({ lat: pos.lat(), lng: pos.lng() });
    });
    // Click map to move marker
    map.addListener("click", (e: any) => {
      const pos = e.latLng;
      marker.setPosition(pos);
      setMapCoords({ lat: pos.lat(), lng: pos.lng() });
    });
    // Search box
    const input = document.getElementById("loc-map-search") as HTMLInputElement;
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places?.length) return;
        const loc = places[0].geometry?.location;
        if (loc) {
          const lat = loc.lat(), lng = loc.lng();
          map.setCenter({ lat, lng });
          marker.setPosition({ lat, lng });
          setMapCoords({ lat, lng });
          setSelectedAddress(places[0].formatted_address || "");
        }
      });
    }
  }, [mapCoords]);

  useEffect(() => {
    if (mapReady && window.google) {
      const t = setTimeout(() => initLocationMap(), 150);
      return () => clearTimeout(t);
    }
  }, [mapReady, initLocationMap]);

  useEffect(() => {
    if (window.google?.maps && !mapInitRef.current && mapApiKey) setMapReady(true);
  }, [mapApiKey]);

  // Core data loader — accepts optional zoneId + search
  const loadHostels = async (zoneId?: string, search?: string) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (zoneId) params.set("zone_id", zoneId);
      if (search) params.set("search", search);
      const qs = params.toString();
      const res = await fetch(`${API_URL}/api/hostels/public${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (data.success && data.data?.hostels) setPublicHostels(data.data.hostels);
      else setPublicHostels([]);
    } catch { setPublicHostels([]); }
    setSearchLoading(false);
  };

  // Handle search button click / Enter key
  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      // Empty search → reset to zone-based or all
      setActiveZoneId("");
      setDetectedZone(null);
      await loadHostels(detectedZone ? String(detectedZone.id) : "");
      return;
    }

    // Check if query matches a zone name
    const matchedZone = zones.find(z =>
      (z.display_name || z.name).toLowerCase() === query.toLowerCase() ||
      z.name.toLowerCase() === query.toLowerCase()
    );

    if (matchedZone) {
      setActiveZoneId(String(matchedZone.id));
      setDetectedZone({ id: matchedZone.id, name: matchedZone.name, display_name: matchedZone.display_name || matchedZone.name });
      await loadHostels(String(matchedZone.id));
    } else {
      // General search — search by name/address
      setActiveZoneId("");
      setDetectedZone(null);
      await loadHostels("", query);
    }
  };

  // Handle city (zone) click from Quick Links or Explore section
  const handleCityClick = async (zone: { id: number; name: string; display_name: string | null }) => {
    const displayName = zone.display_name || zone.name;
    setSearchQuery(displayName);
    setActiveZoneId(String(zone.id));
    setDetectedZone({ id: zone.id, name: zone.name, display_name: displayName });
    await loadHostels(String(zone.id));
  };

  // Step 1: Fetch login URL
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/login-url-public`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.customer_login_url) setLoginUrl(`/login/${data.data.customer_login_url}`);
        }
      } catch {}
    };
    fetchUrls();
  }, []);

  // Step 2: Fetch all zones (always needed)
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch(`${API_URL}/api/zones`);
        const data = await res.json();
        if (data.success && data.data) {
          setZones(data.data.filter((z: any) => z.status === 1));
        }
      } catch {}
    };
    fetchZones();
  }, []);

  // Load data when location is confirmed (or on first mount with saved location)
  useEffect(() => {
    if (!locationReady) return;
    const loadData = async () => {
      const zp = activeZoneId ? `?zone_id=${activeZoneId}` : "";
      const [adsRes, bannersRes, promoRes, hostelsRes] = await Promise.all([
        fetch(`${API_URL}/api/advertisements/list${zp}`),
        fetch(`${API_URL}/api/banners/public${zp}`),
        fetch(`${API_URL}/api/banners/promotional-public`),
        fetch(`${API_URL}/api/hostels/public${zp}`),
      ]);
      try { const d = await adsRes.json(); if (d.success && d.data) setAds(Array.isArray(d.data) ? d.data : []); } catch {}
      try { const d = await bannersRes.json(); if (d.success && d.data) setBanners(d.data); } catch {}
      try { const d = await promoRes.json(); if (d.success && d.data?.image) setPromoBanner(d.data); } catch {}
      try { const d = await hostelsRes.json(); if (d.success && d.data?.hostels) setPublicHostels(d.data.hostels); } catch {}
    };
    loadData();
  }, [locationReady, activeZoneId]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIdx(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const fallbackHostels = [
    { name: "Backpacker's Paradise", location: "Mumbai, Maharashtra", price: 499, rating: 4.8, reviews: 324, image: "🏨", tag: "SuperOYO" },
    { name: "Urban Nest Hostel", location: "Delhi, NCR", price: 399, rating: 4.6, reviews: 256, image: "🏠", tag: "Premium" },
    { name: "Beach Bunk Hostel", location: "Goa", price: 599, rating: 4.9, reviews: 412, image: "🏖️", tag: "Top Rated" },
    { name: "Mountain View Stay", location: "Manali, HP", price: 449, rating: 4.7, reviews: 189, image: "⛰️", tag: "Trending" },
    { name: "City Central Hostel", location: "Bangalore, KA", price: 349, rating: 4.5, reviews: 198, image: "🌆", tag: "Value" },
    { name: "Heritage Hostel", location: "Jaipur, RJ", price: 549, rating: 4.8, reviews: 267, image: "🏰", tag: "Heritage" },
  ];

  const whyChooseUs = [
    { icon: "💰", title: "Lowest Prices", desc: "Best prices guaranteed on all hostels" },
    { icon: "✅", title: "Verified Properties", desc: "All hostels are verified & safe" },
    { icon: "📞", title: "24/7 Support", desc: "Round the clock customer support" },
    { icon: "🔄", title: "Free Cancellation", desc: "Cancel anytime, get full refund" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* ========== LOCATION SETUP SCREEN ========== */}
      {!locationReady ? (
        <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-800 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-xl mx-auto px-4 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Find & Book <span className="text-yellow-300">Hostels</span> Near You</h1>
              <p className="text-emerald-100 text-lg">Set your location to discover the best hostels and deals around you</p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
              {/* Find My Location Button */}
              <button
                onClick={handleFindMyLocation}
                disabled={locating}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-60"
              >
                {locating ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" /></svg>
                )}
                {locating ? "Detecting your location..." : "Find My Location"}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Pick from Map */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 text-left">Pick from Map</h3>
                {mapApiKey ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="relative" style={{ height: "300px" }}>
                      <input
                        id="loc-map-search"
                        type="text"
                        placeholder="Search area..."
                        className="absolute top-2 left-2 z-10 w-64 px-3 py-1.5 border border-gray-300 rounded-lg text-sm shadow bg-white focus:outline-none"
                      />
                      <div ref={mapContainerRef} className="w-full h-full bg-gray-100" />
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">Loading map...</div>
                )}
                {mapCoords && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate max-w-[70%]">
                      {selectedAddress || `${mapCoords.lat.toFixed(4)}, ${mapCoords.lng.toFixed(4)}`}
                    </p>
                    <button
                      onClick={confirmMapLocation}
                      className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-all"
                    >
                      Set Location
                    </button>
                  </div>
                )}
              </div>

              {/* Skip — show all */}
              <button
                onClick={() => setLocationReady(true)}
                className="w-full py-3 text-gray-500 text-sm font-medium hover:text-gray-700 transition-all"
              >
                Skip — Show all hostels
              </button>
            </div>
          </div>

          {mapApiKey && (
            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`}
              onLoad={() => setMapReady(true)}
              strategy="lazyOnload"
            />
          )}
        </section>
      ) : (
      <>

      {/* ========== MAIN LANDING PAGE ========== */}
      {/* Location bar */}
      <div className="bg-emerald-800 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-emerald-200">Delivering to:</span>
          <span className="font-semibold truncate max-w-xs md:max-w-md">{selectedAddress || (userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "All Areas")}</span>
          {detectedZone && <span className="text-emerald-300 text-xs">({detectedZone.display_name})</span>}
        </div>
        <button onClick={clearLocation} className="text-emerald-300 hover:text-white text-xs font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Change
        </button>
      </div>

      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-800 pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Find & Book <span className="text-yellow-300">Hostels</span> Near You
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
              Discover affordable hostels across India. Book rooms, beds, and dorms at the best prices.
            </p>
            {detectedZone && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-emerald-100">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Showing results for <span className="font-semibold text-white">{detectedZone.display_name}</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by city, locality, or hostel name..."
                  className="w-full pl-12 pr-4 py-4 text-gray-700 placeholder-gray-400 focus:outline-none text-sm rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="px-4 py-4 text-gray-700 focus:outline-none text-sm rounded-xl border border-gray-200 w-full md:w-40"
                    placeholder="Check-in"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="px-4 py-4 text-gray-700 focus:outline-none text-sm rounded-xl border border-gray-200 w-full md:w-40"
                    placeholder="Check-out"
                  />
                </div>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="px-4 py-4 text-gray-700 focus:outline-none text-sm rounded-xl border border-gray-200 bg-white w-full md:w-32"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4+ Guests</option>
                </select>
                <button onClick={handleSearch} disabled={searchLoading} className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 whitespace-nowrap disabled:opacity-60">
                  {searchLoading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  )}
                  Search
                </button>
              </div>
            </div>

            {/* Quick Links — dynamic from zones */}
            {zones.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-emerald-200 text-sm">Popular:</span>
                {zones.slice(0, 8).map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => handleCityClick(zone)}
                    className={`px-3 py-1.5 backdrop-blur-sm text-white rounded-full text-xs font-medium hover:bg-white/20 transition-all border border-white/20 ${activeZoneId === String(zone.id) ? "bg-white/30" : "bg-white/10"}`}
                  >
                    {zone.display_name || zone.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "10,000+", label: "Hostels Listed" },
              { value: "50,000+", label: "Happy Customers" },
              { value: "100+", label: "Cities Covered" },
              { value: "4.8★", label: "Average Rating" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-emerald-600">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      {promoBanner?.image && (
        <section className="py-4 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden cursor-pointer group">
              <img
                src={promoBanner.image}
                alt={promoBanner.title || "Promotional Offer"}
                className="w-full h-auto max-h-40 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {promoBanner.title && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                  <div className="px-8">
                    <h3 className="text-white text-xl md:text-2xl font-bold">{promoBanner.title}</h3>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <section className="py-4 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="relative aspect-[4/1] md:aspect-[5/1]">
                {banners.map((banner, idx) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${idx === activeBannerIdx ? "opacity-100" : "opacity-0"}`}
                  >
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-white text-lg md:text-xl font-bold">{banner.title}</h3>
                      {banner.zone_name && <p className="text-white/70 text-sm">{banner.zone_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {banners.length > 1 && (
                <div className="absolute bottom-3 right-4 flex gap-1.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeBannerIdx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Offers / Advertisements For You */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Offers For You</h2>
          </div>
          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <div key={ad.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer">
                  {ad.add_type === "video_promotion" && ad.video_attachment ? (
                    /* Video Ad */
                    <>
                      <div className="relative aspect-video bg-black">
                        <video
                          src={ad.video_attachment}
                          poster={ad.cover_image || undefined}
                          controls
                          muted
                          loop
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-md shadow-lg flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                            Video
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{ad.title}</h3>
                        {ad.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>}
                        {ad.owner_name && <p className="text-xs text-gray-400 mt-2">by {ad.owner_name}</p>}
                      </div>
                    </>
                  ) : (
                    /* Image / Hostel Ad */
                    <>
                      <div className="relative h-48 overflow-hidden">
                        {ad.cover_image ? (
                          <img src={ad.cover_image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : ad.profile_image ? (
                          <img src={ad.profile_image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                            <span className="text-5xl opacity-40">🏷️</span>
                          </div>
                        )}
                        {ad.profile_image && (
                          <div className="absolute top-3 right-3">
                            <img src={ad.profile_image} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md shadow-lg">
                            Sponsored
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{ad.title}</h3>
                        {ad.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>}
                        {ad.owner_name && <p className="text-xs text-gray-400 mt-2">by {ad.owner_name}</p>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Fallback if no ads */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Flat 60% OFF", subtitle: "On first booking", code: "WELCOME60", color: "from-red-500 to-orange-500" },
                { title: `${fc(200)} OFF`, subtitle: `On hostels above ${fc(999)}`, code: "SAVE200", color: "from-purple-500 to-pink-500" },
                { title: "Weekend Special", subtitle: "Extra 30% OFF", code: "WEEKEND30", color: "from-emerald-500 to-teal-500" },
              ].map((offer, i) => (
                <div key={i} className={`bg-gradient-to-r ${offer.color} rounded-xl p-5 text-white cursor-pointer hover:scale-[1.02] transition-transform`}>
                  <div className="text-2xl font-bold mb-1">{offer.title}</div>
                  <div className="text-white/80 text-sm mb-3">{offer.subtitle}</div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <span className="text-xs font-medium">Use code:</span>
                    <span className="text-sm font-bold">{offer.code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Cities — Dynamic from Zones */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Explore Popular Cities</h2>
            {activeZoneId && (
              <button
                onClick={() => {
                  setActiveZoneId("");
                  setDetectedZone(null);
                  setSearchQuery("");
                  loadHostels();
                }}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Show All Cities
              </button>
            )}
          </div>
          {zones.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleCityClick(zone)}
                  className={`relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3] transition-all ${activeZoneId === String(zone.id) ? "ring-3 ring-emerald-400 ring-offset-2" : ""}`}
                >
                  {zone.image ? (
                    <img
                      src={zone.image}
                      alt={zone.display_name || zone.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white/80">{(zone.display_name || zone.name).charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <span className="text-sm font-bold text-white block">{zone.display_name || zone.name}</span>
                    <span className="text-xs text-white/80">{zone.hostels_count || 0} properties</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
              {[
                { name: "Mumbai", properties: "2,450+", image: "🏙️" },
                { name: "Delhi", properties: "1,890+", image: "🏛️" },
                { name: "Bangalore", properties: "1,650+", image: "🌆" },
                { name: "Goa", properties: "980+", image: "🏖️" },
                { name: "Jaipur", properties: "750+", image: "🏰" },
                { name: "Pune", properties: "620+", image: "🏢" },
                { name: "Hyderabad", properties: "580+", image: "🕌" },
                { name: "Chennai", properties: "520+", image: "🌊" },
              ].map((city, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-emerald-50 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{city.image}</span>
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600">{city.name}</span>
                  <span className="text-xs text-gray-500">{city.properties} properties</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Hostels */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {detectedZone ? `Hostels in ${detectedZone.display_name}` : searchQuery ? `Search: "${searchQuery}"` : "Featured Hostels"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {searchLoading ? "Searching..." : `${publicHostels.length} hostel${publicHostels.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(activeZoneId || searchQuery) && (
                <button
                  onClick={() => {
                    setActiveZoneId("");
                    setDetectedZone(null);
                    setSearchQuery("");
                    loadHostels();
                  }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
              <Link href={registerUrl} className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center gap-1">
                View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>

          {publicHostels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicHostels.map((hostel) => (
                <Link key={hostel.id} href={`/hostels/${hostel.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer block">
                  <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center overflow-hidden">
                    {hostel.cover_photo ? (
                      <img src={hostel.cover_photo} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : hostel.logo ? (
                      <img src={hostel.logo} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <span className="text-6xl opacity-50">🏨</span>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md shadow-lg">
                        {hostel.zone_name || "Featured"}
                      </span>
                    </div>
                    {userLocation && hostel.latitude && hostel.longitude && (() => {
                      const km = getDistance(userLocation.lat, userLocation.lng, Number(hostel.latitude), Number(hostel.longitude));
                      return (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {km < 1 ? `${Math.round(km * 1000)} m` : km < 100 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`}
                          </span>
                        </div>
                      );
                    })()}
                    {hostel.total_rooms > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                          {hostel.total_rooms} rooms
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{hostel.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {hostel.address || hostel.zone_name || "India"}
                        </p>
                      </div>
                      {hostel.total_beds > 0 && (
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                          <span className="text-xs font-bold text-emerald-700">{hostel.total_beds} beds</span>
                        </div>
                      )}
                    </div>
                    {hostel.amenities && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {JSON.parse(hostel.amenities || '[]').slice(0, 4).map((a: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-sm">
                        {hostel.min_price && hostel.min_price < 999999 ? (
                          <>
                            <span className="text-xs text-gray-400">From</span>
                            <span className="text-lg font-bold text-emerald-700 ml-1">{fc(hostel.min_price < 999999 ? hostel.min_price : 0)}</span>
                            <span className="text-xs text-gray-400">/night</span>
                          </>
                        ) : hostel.total_beds > 0 ? (
                          <span className="text-xs text-gray-500">{hostel.total_beds} beds</span>
                        ) : (
                          <span className="text-xs text-gray-500">Available now</span>
                        )}
                      </div>
                      <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : activeZoneId || searchQuery ? (
            /* Zone or search was selected but no hostels found */
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <h3 className="text-gray-500 font-semibold text-lg mb-1">No hostels found</h3>
              <p className="text-gray-400 text-sm mb-4">
                {searchQuery ? `No hostels matching "${searchQuery}"` : `No hostels available in ${detectedZone?.display_name || 'this area'} yet`}
              </p>
              <button
                onClick={() => {
                  setActiveZoneId("");
                  setDetectedZone(null);
                  setSearchQuery("");
                  loadHostels();
                }}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
              >
                View All Hostels
              </button>
            </div>
          ) : (
            /* No search active — show fallback demo cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {fallbackHostels.map((hostel, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer">
                  <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <span className="text-6xl opacity-50">{hostel.image}</span>
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md shadow-lg">
                        {hostel.tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{hostel.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                          {hostel.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="text-xs font-bold text-emerald-700">{hostel.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-400 line-through">{fc(Math.round(hostel.price * 1.5))}</span>
                        <span className="text-lg font-bold text-gray-900 ml-1">{fc(hostel.price)}</span>
                        <span className="text-xs text-gray-500">/night</span>
                      </div>
                      <Link href="/register/customer">
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all">
                          Book Now
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">Why Book With {name}?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download App / CTA */}
      <section className="py-12 bg-gradient-to-r from-emerald-700 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Download Our App
              </h2>
              <p className="text-emerald-100 mb-6 max-w-md">
                Get exclusive app-only deals and manage your bookings on the go. Available on iOS & Android.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href={registerUrl}>
                  <button className="px-8 py-3.5 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg">
                    Get Started Free
                  </button>
                </Link>
                <Link href={loginUrl}>
                  <button className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold border border-white/30 hover:bg-white/20 transition-all">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-40 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                <span className="text-5xl">📱</span>
              </div>
              <div className="w-32 h-40 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                <span className="text-5xl">💻</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Rahul Sharma", location: "Mumbai", rating: 5, text: "Best hostel booking experience! Found a great place in Goa at half the price. Highly recommended!" },
              { name: "Priya Patel", location: "Delhi", rating: 5, text: "Clean rooms, friendly staff, and amazing locations. {name} made my backpacking trip so much easier." },
              { name: "Amit Kumar", location: "Bangalore", rating: 4, text: "Great app for budget travelers. The filters help find exactly what you need. Will use again!" },
            ].map((review, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                    <div className="text-xs text-gray-500">{review.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Stay Updated</h2>
          <p className="text-gray-500 mb-6">Get exclusive deals and travel tips delivered to your inbox.</p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <PublicFooter />
      </>
      )}
    </div>
  );
}
