"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { useSiteSettings } from "@/lib/siteSettings";

interface Zone {
  id: number;
  name: string;
  display_name?: string;
}

const amenityOptions = ["WiFi", "Parking", "Laundry", "AC", "Kitchen", "Gym", "Pool", "Security", "Elevator", "CCTV"];

// Custom fields from Join Us Page Setup
interface CustomField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox";
  required: boolean;
  options?: string[];
}

export default function RegisterHostelPage() {
  const router = useRouter();
  const site = useSiteSettings();
  const [user, setUser] = useState<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [step, setStep] = useState(1);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [mapApiKey, setMapApiKey] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const zonePolygonRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const currentZoneIdRef = useRef<string>("");

  // Form data — matches admin create form exactly
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    zone_id: "",
    latitude: "",
    longitude: "",
    total_rooms: "",
    total_beds: "",
    min_stay_days: "1",
    check_in_time: "12:00",
    check_out_time: "11:00",
    // Owner info (pre-filled)
    owner_f_name: "",
    owner_l_name: "",
    owner_phone: "",
    owner_email: "",
  });

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.push("/login/owner");
      return;
    }
    setUser(u);
    setForm((prev) => ({
      ...prev,
      owner_f_name: u.name?.split(" ")[0] || "",
      owner_l_name: u.name?.split(" ").slice(1).join(" ") || "",
      owner_email: u.email || "",
      email: u.email || "",
    }));

    // Fetch zones
    apiFetch("/api/zones")
      .then((res) => { if (res.success) setZones(res.data || []); })
      .catch(() => {});

    // Fetch custom fields from Join Us Page Setup
    apiFetch("/api/settings/join-us-fields")
      .then((res) => { if (res.success && res.data) setCustomFields(res.data); })
      .catch(() => {});
  }, [router]);

  // Load Google Maps script
  useEffect(() => {
    const loadMapScript = async () => {
      try {
        const res = await apiFetch("/api/settings/map");
        const apiKey = res.data?.mapApiKeyClient || res.data?.apiKey;
        if (!res.success || !apiKey) {
          console.warn("Google Maps API key not found");
          return;
        }
        setMapApiKey(apiKey);

        // Check if Google Maps is already loaded
        if ((window as any).google?.maps) {
          return;
        }

        if (!document.getElementById("google-maps-script")) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            console.log("Google Maps script loaded");
          };
          script.onerror = () => console.error("Failed to load Google Maps script");
          document.head.appendChild(script);
        }
      } catch (e) { console.error("Error loading map:", e); }
    };
    loadMapScript();
  }, []);

  // Initialize map when zone is selected and map div exists
  useEffect(() => {
    if (!form.zone_id || !mapApiKey) return;
    
    let retryCount = 0;
    const maxRetries = 10;
    
    const tryInitMap = () => {
      if (mapRef.current && (window as any).google?.maps) {
        initMap(mapApiKey);
        // Draw zone boundary after map is initialized
        setTimeout(() => {
          drawZoneBoundary(form.zone_id);
        }, 300);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryInitMap, 300);
      } else {
        console.error("Google Maps failed to load after retries");
      }
    };
    
    // Wait for DOM to update with map div
    const timer = setTimeout(tryInitMap, 200);
    return () => clearTimeout(timer);
  }, [form.zone_id, mapApiKey]);

  const initMap = (apiKey: string) => {
    if (!mapRef.current || !(window as any).google) return;
    const google = (window as any).google;
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 5,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Create marker
    const marker = new google.maps.Marker({
      position: defaultCenter,
      map,
      draggable: true,
      title: "Hostel Location",
      animation: google.maps.Animation.DROP,
    });
    markerRef.current = marker;

    // Helper to validate and set marker position
    const setMarkerPosition = (pos: any, showWarning = true) => {
      const zoneId = currentZoneIdRef.current;
      if (zoneId && zonePolygonRef.current) {
        const zone = zones.find((z) => z.id.toString() === zoneId);
        if (zone && zone.coordinates) {
          let coords = zone.coordinates;
          if (typeof coords === 'string') coords = JSON.parse(coords);
          const polygon = coords.map((c: any) => ({ lat: c[0], lng: c[1] }));
          const point = { lat: pos.lat(), lng: pos.lng() };
          if (!isPointInPolygon(point, polygon)) {
            if (showWarning) alert('Service not available here. Please select a location inside the highlighted zone.');
            return false;
          }
        }
      }
      marker.setPosition(pos);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 750);
      update('latitude', pos.lat().toFixed(6));
      update('longitude', pos.lng().toFixed(6));
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          update('address', results[0].formatted_address);
        }
      });
      return true;
    };

    // Update coordinates when marker is dragged
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        const zoneId = currentZoneIdRef.current;
        if (zoneId && zonePolygonRef.current) {
          const zone = zones.find((z) => z.id.toString() === zoneId);
          if (zone && zone.coordinates) {
            let coords = zone.coordinates;
            if (typeof coords === 'string') coords = JSON.parse(coords);
            const polygon = coords.map((c: any) => ({ lat: c[0], lng: c[1] }));
            const point = { lat: pos.lat(), lng: pos.lng() };
            if (!isPointInPolygon(point, polygon)) {
              alert('Service not available here. Please select a location inside the highlighted zone.');
              // Reset to previous position
              const lat = parseFloat(form.latitude) || 20.5937;
              const lng = parseFloat(form.longitude) || 78.9629;
              marker.setPosition({ lat, lng });
              return;
            }
          }
        }
        update("latitude", pos.lat().toFixed(6));
        update("longitude", pos.lng().toFixed(6));
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            update("address", results[0].formatted_address);
          }
        });
      }
    });

    // Click on map to set marker
    map.addListener("click", (e: any) => {
      if (e.latLng) {
        setMarkerPosition(e.latLng);
      }
    });

    // Search box
    const input = document.getElementById("hostel-map-search-owner") as HTMLInputElement;
    if (input) {
      const searchBox = new google.maps.places.SearchBox(input);
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry?.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            marker.setPosition(place.geometry.location);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 750);
            update("latitude", place.geometry.location.lat().toFixed(6));
            update("longitude", place.geometry.location.lng().toFixed(6));
            if (place.formatted_address) update("address", place.formatted_address);
          }
        }
      });
    }

    // Add "Find My Location" button inside the map
    const locationButton = document.createElement("div");
    locationButton.className = "custom-map-control-button";
    locationButton.style.cssText = "background: white; margin: 10px; padding: 10px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #333; border: none; transition: all 0.2s;";
    locationButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path></svg> Find My Location`;
    
    locationButton.addEventListener("mouseover", () => {
      locationButton.style.background = "#f0f0f0";
      locationButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    });
    locationButton.addEventListener("mouseout", () => {
      locationButton.style.background = "white";
      locationButton.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    });
    
    locationButton.addEventListener("click", () => {
      if (navigator.geolocation) {
        locationButton.innerHTML = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10"></path></svg> Getting location...`;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(pos);
            map.setZoom(16);
            marker.setPosition(pos);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 750);
            update("latitude", pos.lat.toFixed(6));
            update("longitude", pos.lng.toFixed(6));
            // Reverse geocode
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results: any, status: any) => {
              if (status === "OK" && results?.[0]) {
                update("address", results[0].formatted_address);
              }
            });
            locationButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path></svg> Find My Location`;
          },
          (error) => {
            console.error("Geolocation error:", error);
            let msg = "Unable to get your location";
            if (error.code === 1) msg = "Location access denied. Please allow location permission.";
            if (error.code === 2) msg = "Location unavailable. Please try again.";
            if (error.code === 3) msg = "Location request timed out. Please try again.";
            alert(msg);
            locationButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path></svg> Find My Location`;
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        alert("Geolocation is not supported by your browser");
      }
    });

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(locationButton);
    infoWindowRef.current = new google.maps.InfoWindow();
  };

  // Check if a point is inside a polygon (ray casting algorithm)
  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean => {
    let inside = false;
    const x = point.lat;
    const y = point.lng;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Draw zone boundary on map
  const drawZoneBoundary = (zoneId: string) => {
    const google = (window as any).google;
    if (!google || !mapInstanceRef.current) return;

    // Remove existing polygon
    if (zonePolygonRef.current) {
      zonePolygonRef.current.setMap(null);
      zonePolygonRef.current = null;
    }

    if (!zoneId) return;

    const zone = zones.find((z) => z.id.toString() === zoneId);
    if (!zone || !zone.coordinates) return;

    try {
      let coords = zone.coordinates;
      if (typeof coords === 'string') {
        coords = JSON.parse(coords);
      }

      if (!Array.isArray(coords) || coords.length < 3) return;

      const polygonPath = coords.map((c: any) => ({
        lat: c[0],
        lng: c[1],
      }));

      // Create polygon
      const polygon = new google.maps.Polygon({
        paths: polygonPath,
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        clickable: false,
        map: mapInstanceRef.current,
      });

      zonePolygonRef.current = polygon;

      // Fit map to zone bounds
      const bounds = new google.maps.LatLngBounds();
      polygonPath.forEach((p) => bounds.extend(p));
      mapInstanceRef.current.fitBounds(bounds, 50);

      // Add zone name label at center
      const center = bounds.getCenter();
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(`<div style="font-weight:600;font-size:14px;color:#4285F4;padding:4px 8px;">${zone.display_name || zone.name}</div>`);
        infoWindowRef.current.setPosition(center);
        infoWindowRef.current.open(mapInstanceRef.current);
      }
    } catch (e) {
      console.error('Error drawing zone:', e);
    }
  };

  // Handle zone change
  const handleZoneChange = (zoneId: string) => {
    update('zone_id', zoneId);
    currentZoneIdRef.current = zoneId;
    drawZoneBoundary(zoneId);
    // Clear marker position when zone changes
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: 20.5937, lng: 78.9629 });
    }
    update('latitude', '');
    update('longitude', '');
  };

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
  const toggleAmenity = (a: string) => setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Logo must be an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be less than 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Cover must be an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Cover must be less than 5MB"); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
  };

  const validateStep1 = () => {
    if (!form.name.trim()) { setError("Hostel name is required"); return false; }
    if (!form.address.trim()) { setError("Address is required"); return false; }
    if (!form.zone_id) { setError("Please select a zone"); return false; }
    if (!form.phone.trim()) { setError("Phone number is required"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.total_rooms) { setError("Total rooms is required"); return false; }
    if (!form.total_beds) { setError("Total beds is required"); return false; }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.owner_f_name.trim()) { setError("Owner first name is required"); return; }
    if (!form.owner_l_name.trim()) { setError("Owner last name is required"); return; }
    if (!form.owner_phone.trim()) { setError("Owner phone is required"); return; }
    if (!form.owner_email.trim()) { setError("Owner email is required"); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (value) formData.append(key, value); });
      formData.append("amenities", JSON.stringify(amenities));
      if (logoFile) formData.append("logo", logoFile);
      if (coverFile) formData.append("cover_photo", coverFile);
      // Add custom fields
      Object.entries(customFieldValues).forEach(([key, value]) => { if (value) formData.append(`custom_${key}`, value); });

      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/hostels/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success popup
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-emerald-900/20 border border-white/10 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-emerald-300 text-sm font-medium mb-1">We&apos;re reviewing your details</p>
                  <p className="text-emerald-300/70 text-xs leading-relaxed">Thank you for submitting your hostel registration! Our team is reviewing your application. We will get back to you as soon as possible.</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-left">Your application has been received</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-left">Review typically takes 1-2 business days</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-left">We&apos;ll notify you via email once approved</span>
              </div>
            </div>
            <button
              onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login/owner"); }}
              className="mt-8 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all"
            >Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  const ic = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm";
  const labelCls = "block text-sm font-medium text-gray-300 mb-1.5";
  const name = site.companyName || "Hostel Management";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{name}</h1>
              <p className="text-xs text-emerald-300/60">Hostel Registration</p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login/owner"); }} className="text-sm text-gray-400 hover:text-white transition-colors">Sign Out</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Header */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Hostel Registration Application</h2>
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: "Hostel Info" },
              { num: 2, label: "Details" },
              { num: 3, label: "Owner Info" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    step === s.num ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : step > s.num ? "bg-emerald-600/30 text-emerald-300 cursor-pointer" : "bg-white/5 text-gray-500"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step > s.num ? "bg-emerald-500 text-white" : step === s.num ? "bg-white text-emerald-700" : "bg-white/10 text-gray-500"}`}>
                    {step > s.num ? "✓" : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {s.num < 3 && <div className={`w-8 h-0.5 ${step > s.num ? "bg-emerald-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
            <button onClick={() => setError("")} className="ml-auto"><svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {/* ═══ Step 1: Hostel Info (matches admin create form exactly) ═══ */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>Hostel Name <span className="text-red-400">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: ABC Hostel" maxLength={191} className={ic} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Hostel Address <span className="text-red-400">*</span></label>
                  <textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Ex: House#94, Road#8, Abc City" maxLength={200} rows={2} className={ic + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>Zone <span className="text-red-400">*</span></label>
                  <select value={form.zone_id} onChange={(e) => handleZoneChange(e.target.value)} className={ic + " bg-white/5"}>
                    <option value="">Select Zone</option>
                    {zones.map((z) => (<option key={z.id} value={z.id} className="bg-slate-800">{z.display_name || z.name}</option>))}
                  </select>
                  {form.zone_id && <p className="text-xs text-emerald-400 mt-1">✓ Zone selected - set location inside the highlighted area</p>}
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
                  <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+(880)00-000-00000" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="hostel@example.com" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short description about hostel" className={ic} />
                </div>
              </div>

              {/* Google Map — shown only after zone selection */}
              <div className="mt-6">
                <label className={labelCls}>Location on Map</label>
                {!form.zone_id ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Please select a zone first</p>
                    <p className="text-gray-500 text-xs mt-1">The map will appear after you select a zone above</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3 flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-xs text-blue-300">Click inside the highlighted zone area to set your hostel location</p>
                    </div>
                    <input id="hostel-map-search-owner" type="text" placeholder="Search location here..." className={ic + " mb-3"} />
                    <div ref={mapRef} className="w-full h-[350px] rounded-xl border border-white/10 bg-white/5" />
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Lat:</label>
                        <input type="text" value={form.latitude} readOnly className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 w-28" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Lng:</label>
                        <input type="text" value={form.longitude} readOnly className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 w-28" />
                      </div>
                      {form.latitude && form.longitude && (
                        <span className="text-xs text-emerald-400">✓ Location set</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Logo & Cover — matches admin create form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Hostel Logo <span className="text-red-400">*</span> <span className="text-xs font-normal text-gray-400">(1:1 ratio)</span></h3>
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <div onClick={() => logoRef.current?.click()} className="cursor-pointer border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-xl object-cover mx-auto" />
                      <button onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(""); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-sm text-gray-400">Click to upload logo</p>
                      <p className="text-xs text-gray-500 mt-1">Max 2MB</p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Cover Photo <span className="text-red-400">*</span> <span className="text-xs font-normal text-gray-400">(3:1 ratio)</span></h3>
                <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                <div onClick={() => coverRef.current?.click()} className="cursor-pointer border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all">
                  {coverPreview ? (
                    <div className="relative">
                      <img src={coverPreview} alt="Cover" className="w-full h-24 rounded-xl object-cover" />
                      <button onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(""); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-sm text-gray-400">Click to upload cover</p>
                      <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={nextStep} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2">
                Next: Details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* ═══ Step 2: General Settings + Amenities (matches admin create form exactly) ═══ */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                General Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Total Rooms <span className="text-red-400">*</span></label>
                  <input type="number" value={form.total_rooms} onChange={(e) => update("total_rooms", e.target.value)} placeholder="Ex: 20" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Total Beds <span className="text-red-400">*</span></label>
                  <input type="number" value={form.total_beds} onChange={(e) => update("total_beds", e.target.value)} placeholder="Ex: 50" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Minimum Stay (days)</label>
                  <input type="number" value={form.min_stay_days} onChange={(e) => update("min_stay_days", e.target.value)} placeholder="Ex: 1" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Check-in Time</label>
                  <input type="time" value={form.check_in_time} onChange={(e) => update("check_in_time", e.target.value)} className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Check-out Time</label>
                  <input type="time" value={form.check_out_time} onChange={(e) => update("check_out_time", e.target.value)} className={ic} />
                </div>
              </div>

              {/* Amenities — matches admin create form exactly */}
              <div className="mt-6">
                <label className={labelCls}>Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        amenities.includes(a)
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                      }`}
                    >{a}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Fields from Join Us Page Setup */}
            {customFields.length > 0 && (
              <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                      <label className={labelCls}>
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={customFieldValues[field.name] || ""}
                          onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                          rows={3}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className={ic + " resize-none"}
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={customFieldValues[field.name] || ""}
                          onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                          className={ic + " bg-white/5"}
                        >
                          <option value="">Select {field.label}</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt} className="bg-slate-800">{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={customFieldValues[field.name] || ""}
                          onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className={ic}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
              </button>
              <button onClick={nextStep} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2">
                Next: Owner Info <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* ═══ Step 3: Owner Info (matches admin create form exactly) ═══ */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Owner Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>First Name <span className="text-red-400">*</span></label>
                  <input type="text" value={form.owner_f_name} onChange={(e) => update("owner_f_name", e.target.value)} placeholder="Ex: John" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-red-400">*</span></label>
                  <input type="text" value={form.owner_l_name} onChange={(e) => update("owner_l_name", e.target.value)} placeholder="Ex: Doe" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
                  <input type="tel" value={form.owner_phone} onChange={(e) => update("owner_phone", e.target.value)} placeholder="+(880)00-000-00000" className={ic} />
                </div>
                <div>
                  <label className={labelCls}>Email <span className="text-red-400">*</span></label>
                  <input type="email" value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} placeholder="owner@example.com" className={ic} />
                </div>
              </div>

              <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">What happens next?</p>
                    <p className="text-yellow-300/70 text-xs mt-1 leading-relaxed">After submitting your application, our admin team will review your hostel details. Once approved, you&apos;ll be able to access the owner dashboard to manage your hostel, rooms, and bookings.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
              </button>
              <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? (<><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Submitting...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Submit Application</>)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
