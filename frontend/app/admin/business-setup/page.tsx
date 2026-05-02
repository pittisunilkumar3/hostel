"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { API_URL } from "@/lib/auth";
import { useCurrency } from "@/lib/useCurrency";
import Script from "next/script";

const sidebarItems = getSidebarItems();

declare global { interface Window { google: any; } }

const ic = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all";

export default function BusinessSetup() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"business" | "payment">("business");
  const { symbol } = useCurrency();

  // Business state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyCountry, setCompanyCountry] = useState("India");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyLatitude, setCompanyLatitude] = useState("");
  const [companyLongitude, setCompanyLongitude] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyFavicon, setCompanyFavicon] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  const [timeFormat, setTimeFormat] = useState("12");
  const [countryPickerStatus, setCountryPickerStatus] = useState(true);
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [currencySymbolPosition, setCurrencySymbolPosition] = useState("left");
  const [decimalDigits, setDecimalDigits] = useState("0");
  const [businessModel, setBusinessModel] = useState("commission");
  const [defaultCommission, setDefaultCommission] = useState("12");
  const [commissionOnDelivery, setCommissionOnDelivery] = useState("0");
  const [additionalChargeStatus, setAdditionalChargeStatus] = useState(false);
  const [additionalChargeName, setAdditionalChargeName] = useState("Service Charge");
  const [additionalChargeAmount, setAdditionalChargeAmount] = useState("50");
  const [copyrightText, setCopyrightText] = useState("");
  const [cookiesText, setCookiesText] = useState("We use cookies to improve your experience.");

  // Payment state
  const [codActive, setCodActive] = useState(true);
  const [digitalActive, setDigitalActive] = useState(false);
  const [offlineActive, setOfflineActive] = useState(false);
  const [partialActive, setPartialActive] = useState(false);

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Map state
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapReady, setMapReady] = useState(typeof window !== 'undefined' && !!(window as any).google?.maps);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapInitDone = useRef(false);

  useEffect(() => { setUser(getCurrentUser()); fetchSettings(); fetchMapKey(); }, []);

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

    const lat = parseFloat(companyLatitude) || 17.385;
    const lng = parseFloat(companyLongitude) || 78.4867;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 13,
      mapTypeControl: false,
    });
    mapInstanceRef.current = map;

    // Marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
    });
    markerRef.current = marker;

    // Update lat/lng when marker is dragged
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        setCompanyLatitude(pos.lat().toFixed(6));
        setCompanyLongitude(pos.lng().toFixed(6));
      }
    });

    // Search box
    const input = document.getElementById("biz-map-search") as HTMLInputElement;
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
          setCompanyLatitude(loc.lat().toFixed(6));
          setCompanyLongitude(loc.lng().toFixed(6));
        }
      });
    }
  }, [companyLatitude, companyLongitude]);

  useEffect(() => {
    if (mapReady && window.google) {
      const t = setTimeout(() => initMap(), 150);
      return () => clearTimeout(t);
    }
  }, [mapReady, initMap]);

  // Handle google already loaded
  useEffect(() => {
    if (window.google?.maps && !mapInitDone.current && !mapReady) {
      setMapReady(true);
    }
  }, [mapApiKey, mapReady]);

  // Update marker when lat/lng inputs change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !window.google) return;
    const lat = parseFloat(companyLatitude);
    const lng = parseFloat(companyLongitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const pos = { lat, lng };
      mapInstanceRef.current.setCenter(pos);
      markerRef.current.setPosition(pos);
    }
  }, [companyLatitude, companyLongitude]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
      if (mapInstanceRef.current) { mapInstanceRef.current = null; }
      mapInitDone.current = false;
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/settings/business");
      if (res.success && res.data) {
        const d = res.data;
        setMaintenanceMode(d.maintenance_mode_active === 1 || d.maintenance_mode === "1");
        setCompanyName(d.company_name || "");
        setCompanyEmail(d.company_email || "");
        setCompanyPhone(d.company_phone || "");
        setCompanyCountry(d.company_country || "India");
        setCompanyDescription(d.company_description || "");
        setCompanyLatitude(d.company_latitude || "");
        setCompanyLongitude(d.company_longitude || "");
        setCompanyLogo(d.company_logo || "");
        setCompanyFavicon(d.company_favicon || "");
        setTimeZone(d.time_zone || "Asia/Kolkata");
        setTimeFormat(d.time_format || "12");
        setCountryPickerStatus(d.country_picker_status_active === 1 || d.country_picker_status === "1");
        setCurrencyCode(d.currency_code || "INR");
        setCurrencySymbolPosition(d.currency_symbol_position || "left");
        setDecimalDigits(d.decimal_digits || "0");
        setBusinessModel(d.business_model || "commission");
        setDefaultCommission(d.default_commission || "12");
        setCommissionOnDelivery(d.commission_on_delivery || "0");
        setAdditionalChargeStatus(d.additional_charge_status_active === 1 || d.additional_charge_status === "1");
        setAdditionalChargeName(d.additional_charge_name || "Service Charge");
        setAdditionalChargeAmount(d.additional_charge_amount || "50");
        setCopyrightText(d.copyright_text || "");
        setCookiesText(d.cookies_text || "We use cookies to improve your experience.");
        setCodActive(d.payment_cod_active === 1 || d.payment_cod_active === "1");
        setDigitalActive(d.payment_digital_active === 1 || d.payment_digital_active === "1");
        setOfflineActive(d.payment_offline_active === 1 || d.payment_offline_active === "1");
        setPartialActive(d.payment_partial_active === 1 || d.payment_partial_active === "1");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const uploadFile = async (file: File, type: "logo" | "favicon"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/settings/upload`, {
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
      let logoUrl = companyLogo;
      if (logoFile) {
        setUploadingLogo(true);
        const uploaded = await uploadFile(logoFile, "logo");
        if (uploaded) logoUrl = uploaded;
        setUploadingLogo(false);
      }

      // Upload favicon if changed
      let faviconUrl = companyFavicon;
      if (faviconFile) {
        setUploadingFavicon(true);
        const uploaded = await uploadFile(faviconFile, "favicon");
        if (uploaded) faviconUrl = uploaded;
        setUploadingFavicon(false);
      }

      const res = await apiFetch("/api/settings/business", {
        method: "PUT",
        body: JSON.stringify({
          maintenance_mode: maintenanceMode ? "1" : "0", maintenance_mode_active: maintenanceMode,
          company_name: companyName, company_email: companyEmail, company_phone: companyPhone,
          company_country: companyCountry, company_description: companyDescription,
          company_latitude: companyLatitude, company_longitude: companyLongitude,
          company_logo: logoUrl, company_favicon: faviconUrl,
          time_zone: timeZone, time_format: timeFormat,
          country_picker_status: countryPickerStatus ? "1" : "0", country_picker_status_active: countryPickerStatus,
          currency_code: currencyCode, currency_symbol_position: currencySymbolPosition,
          decimal_digits: decimalDigits, business_model: businessModel,
          default_commission: defaultCommission, commission_on_delivery: commissionOnDelivery,
          additional_charge_status: additionalChargeStatus ? "1" : "0", additional_charge_status_active: additionalChargeStatus,
          additional_charge_name: additionalChargeName, additional_charge_amount: additionalChargeAmount,
          copyright_text: copyrightText, cookies_text: cookiesText,
          payment_cod_active: codActive ? "1" : "0", payment_digital_active: digitalActive ? "1" : "0",
          payment_offline_active: offlineActive ? "1" : "0", payment_partial_active: partialActive ? "1" : "0",
        }),
      });
      setMessage(res.success ? { type: "success", text: "✅ Settings saved successfully! Changes will reflect across the whole website." } : { type: "error", text: res.message || "Failed" });
      if (res.success) {
        // Clear cached settings so ALL pages refresh immediately
        localStorage.removeItem("siteSettings");
        window.dispatchEvent(new Event("site-settings-changed"));
      }
    } catch { setMessage({ type: "error", text: "Network error" }); }
    finally { setSaving(false); }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center cursor-pointer shrink-0">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className={`w-12 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-300"}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-6" : ""}`} />
      </div>
    </label>
  );

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><p className="text-gray-400">Loading...</p></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Setup</h1>
        <p className="text-gray-500 mt-1">Configure your business information, branding, and operational settings. Changes affect the entire website.</p>
      </div>

      {/* Impact Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Global Settings</h4>
          <p className="text-xs text-blue-700 mt-0.5">All changes made here are saved to the database and automatically reflect across: homepage, login pages, sidebar, registration, dashboard, footer, copyright text, favicon, and page titles.</p>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
        <button onClick={() => setActiveTab("business")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "business" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Business Settings
        </button>
        <button onClick={() => setActiveTab("payment")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "payment" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Payment Setup
        </button>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      {/* ============================================================ */}
      {/* PAYMENT SETUP TAB */}
      {/* ============================================================ */}
      {activeTab === "payment" && (
        <div className="space-y-6">

          {/* Payment Options */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Payment Options</h3>
              <p className="text-xs text-gray-500 mt-0.5">Setup your payment methods from here. These affect booking checkout flow.</p>
            </div>
            <div className="p-6 space-y-4">

              {/* Cash On Delivery */}
              <div className={`rounded-xl border-2 p-5 transition-all ${codActive ? "border-green-300 bg-green-50/30" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${codActive ? "bg-green-100" : "bg-gray-100"}`}>
                      <svg className={`w-6 h-6 ${codActive ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Cash On Delivery</h4>
                        {codActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Active</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">Allow customers to pay in cash when the order is delivered.</p>
                    </div>
                  </div>
                  <Toggle checked={codActive} onChange={setCodActive} />
                </div>
              </div>

              {/* Digital Payment */}
              <div className={`rounded-xl border-2 p-5 transition-all ${digitalActive ? "border-blue-300 bg-blue-50/30" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${digitalActive ? "bg-blue-100" : "bg-gray-100"}`}>
                      <svg className={`w-6 h-6 ${digitalActive ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Digital Payment</h4>
                        {digitalActive && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Active</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">Enable secure online payments using supported payment gateways.</p>
                    </div>
                  </div>
                  <Toggle checked={digitalActive} onChange={setDigitalActive} />
                </div>
              </div>

              {/* Offline Payment */}
              <div className={`rounded-xl border-2 p-5 transition-all ${offlineActive ? "border-purple-300 bg-purple-50/30" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${offlineActive ? "bg-purple-100" : "bg-gray-100"}`}>
                      <svg className={`w-6 h-6 ${offlineActive ? "text-purple-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Offline Payment</h4>
                        {offlineActive && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase">Active</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">Pay through offline methods such as bank transfers or manual payments.</p>
                    </div>
                  </div>
                  <Toggle checked={offlineActive} onChange={setOfflineActive} />
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">To enable this feature must be activated</h4>
                <ul className="mt-2 space-y-1.5">
                  <li className="flex items-center gap-2 text-xs text-amber-700">
                    <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                    At least one payment method from the Payment Option Section.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Partial Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Partial Payment</h3>
              <p className="text-xs text-gray-500 mt-0.5">By switching this feature ON, Customer can pay partially from other payment gateways.</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-5 flex items-center justify-between border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enable partial payment for customers</p>
                </div>
                <Toggle checked={partialActive} onChange={setPartialActive} />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30">
              {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BUSINESS SETTINGS TAB */}
      {/* ============================================================ */}
      {activeTab === "business" && (
        <div className="space-y-6">

          {/* Maintenance Mode */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Maintenance Mode</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Turn ON to temporarily deactivate the website for all users except admins.</p>
                </div>
                <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
              </div>
            </div>
            {maintenanceMode && (
              <div className="px-6 py-4 bg-amber-50/50">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <p className="text-xs text-amber-700">Maintenance mode is <strong>ON</strong>. Your site is temporarily unavailable to customers.</p>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
              <p className="text-xs text-gray-500 mt-0.5">This information appears across the website: homepage title, sidebar, login pages, footer, etc.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name <span className="text-red-500">*</span></label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" className={ic} />
                <p className="text-[10px] text-gray-400 mt-1">This becomes the page title, sidebar header &amp; homepage heading</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="info@company.com" className={ic} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+91 9876543210" className={ic} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                <select value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} className={ic + " bg-white"}>
                  <option value="">Select Country</option>
                  <option value="India">India</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option><option value="Canada">Canada</option><option value="Australia">Australia</option><option value="Singapore">Singapore</option><option value="UAE">UAE</option><option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="Enter business description" rows={3} className={ic + " resize-none"} />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{companyDescription.length}/200</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
                  <input type="text" value={companyLatitude} onChange={(e) => setCompanyLatitude(e.target.value)} placeholder="12.971599" className={ic} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                  <input type="text" value={companyLongitude} onChange={(e) => setCompanyLongitude(e.target.value)} placeholder="77.594566" className={ic} />
                </div>
              </div>
              <div className="border border-gray-300 rounded-xl h-52 relative bg-gray-50">
                {!mapApiKey ? (
                  <div className="flex items-center justify-center h-full text-center p-4">
                    <div>
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <p className="text-xs text-gray-400">Map API Key not configured</p>
                      <p className="text-[10px] text-gray-300 mt-1">Add it in <a href="/admin/settings" className="underline">System Settings → Map API Key</a></p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input id="biz-map-search" type="text" placeholder="Search location..."
                      className="absolute top-2 left-2 z-10 w-64 px-3 py-1.5 border border-gray-300 rounded text-sm shadow bg-white focus:outline-none" />
                    <div ref={mapRef} className="w-full h-full" />
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Drag the marker or search a location to set latitude &amp; longitude automatically</p>
            </div>
          </div>

          {/* Logo & Favicon */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                <h3 className="text-base font-bold text-gray-900">Logo &amp; Favicon</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">Logo appears in sidebar &amp; login pages. Favicon appears in the browser tab.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-2">Upload your Business Logo (shown in sidebar &amp; all pages)</p>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                  {companyLogo ? <img src={companyLogo} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-2 rounded-lg" /> : <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setLogoFile(f);
                      setCompanyLogo(URL.createObjectURL(f));
                    }
                  }} className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  <p className="text-[10px] text-gray-400 mt-2">Jpeg, jpg, png, gif, webp — Max 2 MB (3:1)</p>
                  {uploadingLogo && <p className="text-[10px] text-indigo-600 mt-1 animate-pulse">Uploading...</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favicon <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-2">Upload your website favicon (shown in browser tab)</p>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                  {companyFavicon ? <img src={companyFavicon} alt="Favicon" className="w-12 h-12 object-contain mx-auto mb-2 rounded-lg" /> : <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFaviconFile(f);
                      setCompanyFavicon(URL.createObjectURL(f));
                    }
                  }} className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  <p className="text-[10px] text-gray-400 mt-2">Jpeg, jpg, png, gif, webp — Max 2 MB (1:1)</p>
                  {uploadingFavicon && <p className="text-[10px] text-indigo-600 mt-1 animate-pulse">Uploading...</p>}
                </div>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">General Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Time zone affects booking times. Currency affects room prices displayed across the site.</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Time Setup */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center"><svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                  <h4 className="text-sm font-bold text-gray-900">Time Setup</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time zone <span className="text-red-500">*</span></label>
                    <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={ic + " bg-white"}>
                      <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option><option value="America/New_York">(GMT-05:00) America/New_York</option><option value="America/Los_Angeles">(GMT-08:00) America/Los_Angeles</option><option value="Europe/London">(GMT+00:00) Europe/London</option><option value="Asia/Dubai">(GMT+04:00) Asia/Dubai</option><option value="Asia/Singapore">(GMT+08:00) Asia/Singapore</option><option value="Australia/Sydney">(GMT+11:00) Australia/Sydney</option><option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time format <span className="text-red-500">*</span></label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="timeFormat" value="12" checked={timeFormat === "12"} onChange={(e) => setTimeFormat(e.target.value)} className="text-indigo-600 focus:ring-indigo-500" /><span className="text-sm text-gray-700">12 hour</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="timeFormat" value="24" checked={timeFormat === "24"} onChange={(e) => setTimeFormat(e.target.value)} className="text-indigo-600 focus:ring-indigo-500" /><span className="text-sm text-gray-700">24 hour</span></label>
                    </div>
                  </div>
                </div>
              </div>
              {/* Country Picker */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-gray-900">Country Picker</h4>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                  <div><p className="text-sm font-semibold text-gray-900">Status</p><p className="text-xs text-gray-400 mt-0.5">Show country picker on customer-facing pages</p></div>
                  <Toggle checked={countryPickerStatus} onChange={setCountryPickerStatus} />
                </div>
              </div>
              {/* Currency Setup */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-gray-900">Currency Setup</h4>
                  <span className="text-[10px] text-gray-400">Affects room prices, booking amounts &amp; invoices</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency <span className="text-red-500">*</span></label>
                    <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className={ic + " bg-white"}>
                      <option value="INR">INR ( ₹ )</option><option value="USD">USD ( $ )</option><option value="EUR">EUR ( € )</option><option value="GBP">GBP ( £ )</option><option value="AED">AED ( د.إ )</option><option value="SGD">SGD ( S$ )</option><option value="AUD">AUD ( A$ )</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency symbol position <span className="text-red-500">*</span></label>
                    <select value={currencySymbolPosition} onChange={(e) => setCurrencySymbolPosition(e.target.value)} className={ic + " bg-white"}>
                      <option value="left">Left (₹123)</option><option value="right">Right (123₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digit after decimal point <span className="text-red-500">*</span></label>
                    <select value={decimalDigits} onChange={(e) => setDecimalDigits(e.target.value)} className={ic + " bg-white"}>
                      <option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Model */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Business Model Setup</h3>
              <p className="text-xs text-gray-500 mt-0.5">Setup your business model from here.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Model <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${businessModel === "subscription" ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-2"><input type="radio" name="bmodel" value="subscription" checked={businessModel === "subscription"} onChange={(e) => setBusinessModel(e.target.value)} className="text-indigo-600" /><span className="text-sm font-bold text-gray-900">Subscription</span></div>
                    <p className="text-xs text-gray-500 leading-relaxed">Subscription based model with recurring payments.</p>
                  </label>
                  <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${businessModel === "commission" ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-2"><input type="radio" name="bmodel" value="commission" checked={businessModel === "commission"} onChange={(e) => setBusinessModel(e.target.value)} className="text-indigo-600" /><span className="text-sm font-bold text-gray-900">Commission</span></div>
                    <p className="text-xs text-gray-500 leading-relaxed">Commission based payment per booking.</p>
                  </label>
                </div>
              </div>
              {businessModel === "commission" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Default commission (%) <span className="text-red-500">*</span></label><input type="number" value={defaultCommission} onChange={(e) => setDefaultCommission(e.target.value)} placeholder="12" className={ic} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Commission on Delivery Charge (%) <span className="text-red-500">*</span></label><input type="number" value={commissionOnDelivery} onChange={(e) => setCommissionOnDelivery(e.target.value)} placeholder="0" className={ic} /></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Charge */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Additional Charge Setup</h3>
              <p className="text-xs text-gray-500 mt-0.5">By switching this feature ON, Customer need to pay the amount you set.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Status</p>
                <Toggle checked={additionalChargeStatus} onChange={setAdditionalChargeStatus} />
              </div>
              {additionalChargeStatus && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Additional charge name <span className="text-red-500">*</span></label><input type="text" value={additionalChargeName} onChange={(e) => setAdditionalChargeName(e.target.value)} placeholder="Service Charge" className={ic} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{`Charge amount (${symbol})`} <span className="text-red-500">*</span></label><input type="number" value={additionalChargeAmount} onChange={(e) => setAdditionalChargeAmount(e.target.value)} placeholder="50" className={ic} /></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content Setup */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Content Setup</h3>
              <p className="text-xs text-gray-500 mt-0.5">Copyright text appears in the footer of every page. Cookies text shows in cookie banner.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Copyright text <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} placeholder="© 2026 Hostel Management System. All rights reserved." rows={2} className={ic + " resize-none"} />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">{copyrightText.length}/200</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Shown at the bottom of homepage, login pages &amp; registration pages</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cookies Text <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={cookiesText} onChange={(e) => setCookiesText(e.target.value)} placeholder="We use cookies to improve your experience." className={ic} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{cookiesText.length}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving || uploadingLogo || uploadingFavicon} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30">
              {saving || uploadingLogo || uploadingFavicon ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>{uploadingLogo || uploadingFavicon ? "Uploading files..." : "Saving..."}</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Changes</>}
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
