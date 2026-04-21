"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

const ic = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all";

type Tab = "app-version" | "features" | "theme" | "landing" | "website";

// ─── Toggle Component ────────────────────────────────────────────────
function Toggle({ checked, onChange, label, description, disabled = false }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <label className="flex items-center cursor-pointer shrink-0">
        <div className="relative">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
          <div className={`w-12 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-300"} ${disabled ? "opacity-50" : ""}`} />
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-6" : ""}`} />
        </div>
      </label>
    </div>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", hint, mono = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={ic + (mono ? " font-mono" : "")} />
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Version Control Card ────────────────────────────────────────────
function VersionCard({ title, icon, androidVersion, setAndroidVersion, androidUrl, setAndroidUrl,
  iosVersion, setIosVersion, iosUrl, setIosUrl }: {
  title: string; icon: React.ReactNode;
  androidVersion: string; setAndroidVersion: (v: string) => void;
  androidUrl: string; setAndroidUrl: (v: string) => void;
  iosVersion: string; setIosVersion: (v: string) => void;
  iosUrl: string; setIosUrl: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {icon}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Set minimum version for force update &amp; download URL</p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Android */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-lg">🤖</span> Android
            </h4>
            <div className="space-y-3">
              <Field label="Minimum Version (Force Update)" value={androidVersion} onChange={setAndroidVersion}
                placeholder="1.0.0" type="number" hint="App will force update if version is below this" />
              <Field label="Download URL" value={androidUrl} onChange={setAndroidUrl}
                placeholder="https://play.google.com/store/apps/details?id=..." hint="Play Store or direct APK link" />
            </div>
          </div>
          {/* iOS */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-lg">🍎</span> iOS
            </h4>
            <div className="space-y-3">
              <Field label="Minimum Version (Force Update)" value={iosVersion} onChange={setIosVersion}
                placeholder="1.0.0" type="number" hint="App will force update if version is below this" />
              <Field label="Download URL" value={iosUrl} onChange={setIosUrl}
                placeholder="https://apps.apple.com/app/..." hint="App Store link" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Theme Card ──────────────────────────────────────────────────────
function ThemeCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const themes = [
    { id: "1", label: "Classic", desc: "Clean traditional layout", gradient: "from-blue-500 to-blue-700" },
    { id: "2", label: "Modern", desc: "Bold contemporary design", gradient: "from-purple-500 to-pink-600" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {themes.map((t) => (
        <label key={t.id}
          className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${value === t.id ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 hover:border-gray-300"}`}>
          <div className="flex items-center gap-2 mb-3">
            <input type="radio" name="theme" value={t.id} checked={value === t.id} onChange={(e) => onChange(e.target.value)} className="text-indigo-600" />
            <span className="text-sm font-bold text-gray-900">{t.label}</span>
          </div>
          <div className={`w-full h-28 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white text-xs font-mono">
              [ Preview: {t.label} ]
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t.desc}</p>
        </label>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function AppWebsiteSettings() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("app-version");

  // App version state — User App
  const [userAndroidVer, setUserAndroidVer] = useState("1.0.0");
  const [userAndroidUrl, setUserAndroidUrl] = useState("");
  const [userIosVer, setUserIosVer] = useState("1.0.0");
  const [userIosUrl, setUserIosUrl] = useState("");

  // Owner App
  const [ownerAndroidVer, setOwnerAndroidVer] = useState("1.0.0");
  const [ownerAndroidUrl, setOwnerAndroidUrl] = useState("");
  const [ownerIosVer, setOwnerIosVer] = useState("1.0.0");
  const [ownerIosUrl, setOwnerIosUrl] = useState("");

  // Feature toggles
  const [popularRooms, setPopularRooms] = useState(true);
  const [popularHostels, setPopularHostels] = useState(true);
  const [newListings, setNewListings] = useState(true);
  const [topRated, setTopRated] = useState(true);

  // Theme
  const [theme, setTheme] = useState("1");

  // Landing Page
  const [landingType, setLandingType] = useState("default");
  const [landingUrl, setLandingUrl] = useState("");
  const [landingStatus, setLandingStatus] = useState(true);

  // Website Settings
  const [darkMode, setDarkMode] = useState(false);
  const [cookiesBanner, setCookiesBanner] = useState(true);
  const [guestCheckout, setGuestCheckout] = useState(true);
  const [websiteLoader, setWebsiteLoader] = useState(true);
  const [smoothScroll, setSmoothScroll] = useState(true);

  useEffect(() => { setUser(getCurrentUser()); fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/settings/app-website");
      if (res.success && res.data) {
        const d = res.data;
        // User App
        setUserAndroidVer(d.app_minimum_version_android || "1.0.0");
        setUserAndroidUrl(d.app_url_android || "");
        setUserIosVer(d.app_minimum_version_ios || "1.0.0");
        setUserIosUrl(d.app_url_ios || "");
        // Owner App
        setOwnerAndroidVer(d.app_minimum_version_android_owner || "1.0.0");
        setOwnerAndroidUrl(d.app_url_android_owner || "");
        setOwnerIosVer(d.app_minimum_version_ios_owner || "1.0.0");
        setOwnerIosUrl(d.app_url_ios_owner || "");
        // Delivery App

        // Features
        setPopularRooms(d.popular_rooms_active === 1 || d.popular_rooms === "1");
        setPopularHostels(d.popular_hostels_active === 1 || d.popular_hostels === "1");
        setNewListings(d.new_listings_active === 1 || d.new_listings === "1");
        setTopRated(d.top_rated_active === 1 || d.top_rated === "1");
        // Theme
        setTheme(d.theme || "1");
        // Landing
        setLandingType(d.landing_page_type || "default");
        setLandingUrl(d.landing_page_url || "");
        setLandingStatus(d.landing_page_status_active === 1 || d.landing_page_status === "1");
        // Website
        setDarkMode(d.dark_mode_active === 1 || d.dark_mode === "1");
        setCookiesBanner(d.cookies_banner_status_active === 1 || d.cookies_banner_status === "1");
        setGuestCheckout(d.guest_checkout_status_active === 1 || d.guest_checkout_status === "1");
        setWebsiteLoader(d.website_loader_status_active === 1 || d.website_loader_status === "1");
        setSmoothScroll(d.smooth_scroll_status_active === 1 || d.smooth_scroll_status === "1");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (saveType: string) => {
    setSaving(true); setMessage(null);
    try {
      let payload: Record<string, any> = { type: saveType };

      if (saveType === "user_app") {
        payload = { ...payload, app_minimum_version_android: userAndroidVer, app_url_android: userAndroidUrl,
          app_minimum_version_ios: userIosVer, app_url_ios: userIosUrl };
      } else if (saveType === "owner_app") {
        payload = { ...payload, app_minimum_version_android_owner: ownerAndroidVer, app_url_android_owner: ownerAndroidUrl,
          app_minimum_version_ios_owner: ownerIosVer, app_url_ios_owner: ownerIosUrl };
      } else if (saveType === "theme") {
        payload = { ...payload, theme };
      } else if (saveType === "landing_page") {
        payload = { ...payload, landing_page_type: landingType, landing_page_url: landingUrl, landing_page_status: landingStatus };
      } else if (saveType === "toggles") {
        payload = { ...payload, popular_rooms: popularRooms, popular_hostels: popularHostels,
          new_listings: newListings, top_rated: topRated,
          dark_mode: darkMode, cookies_banner_status: cookiesBanner, guest_checkout_status: guestCheckout,
          website_loader_status: websiteLoader, smooth_scroll_status: smoothScroll };
      }

      const res = await apiFetch("/api/settings/app-website", { method: "PUT", body: JSON.stringify(payload) });
      setMessage(res.success ? { type: "success", text: "✅ Settings saved successfully!" } : { type: "error", text: res.message || "Failed" });
    } catch { setMessage({ type: "error", text: "Network error" }); }
    finally { setSaving(false); }
  };

  const SaveBtn = ({ onClick, label = "Save Changes" }: { onClick: () => void; label?: string }) => (
    <div className="flex justify-end mt-6">
      <button onClick={onClick} disabled={saving}
        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30">
        {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{label}</>}
      </button>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "app-version", label: "App Version", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    { key: "features", label: "Features", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { key: "theme", label: "Theme", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
    { key: "landing", label: "Landing Page", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: "website", label: "Website", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg> },
  ];

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><p className="text-gray-400">Loading...</p></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">App &amp; Website Settings</h1>
        <p className="text-gray-500 mt-1">Manage app version control, feature toggles, theme, landing page &amp; website settings</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-900">How it works</h4>
          <p className="text-xs text-indigo-700 mt-0.5">App version controls force-update on mobile apps. Feature toggles enable/disable sections on the user-facing app &amp; website. Theme changes the look and feel of the user app. Landing page settings control the homepage.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setMessage(null); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === t.key ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      {/* ═══════════════════ APP VERSION CONTROL ═══════════════════ */}
      {tab === "app-version" && (
        <div className="space-y-6">
          {/* User App */}
          <VersionCard title="User App Version Control"
            icon={<div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>}
            androidVersion={userAndroidVer} setAndroidVersion={setUserAndroidVer}
            androidUrl={userAndroidUrl} setAndroidUrl={setUserAndroidUrl}
            iosVersion={userIosVer} setIosVersion={setUserIosVer}
            iosUrl={userIosUrl} setIosUrl={setUserIosUrl} />
          <SaveBtn onClick={() => handleSave("user_app")} label="Save User App Settings" />

          {/* Owner App */}
          <VersionCard title="Owner App Version Control"
            icon={<div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div>}
            androidVersion={ownerAndroidVer} setAndroidVersion={setOwnerAndroidVer}
            androidUrl={ownerAndroidUrl} setAndroidUrl={setOwnerAndroidUrl}
            iosVersion={ownerIosVer} setIosVersion={setOwnerIosVer}
            iosUrl={ownerIosUrl} setIosUrl={setOwnerIosUrl} />
          <SaveBtn onClick={() => handleSave("owner_app")} label="Save Owner App Settings" />


        </div>
      )}

      {/* ═══════════════════ FEATURE TOGGLES ═══════════════════ */}
      {tab === "features" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">App &amp; Website Feature Sections</h3>
              <p className="text-xs text-gray-500 mt-0.5">Toggle feature sections that appear on the user app &amp; website. Disabled sections will be hidden from users.</p>
            </div>
            <div className="p-6 space-y-3">
              <Toggle checked={popularRooms} onChange={setPopularRooms} label="Popular Rooms" description="If enabled, Popular Rooms section will be available on the User App & website." />
              <Toggle checked={popularHostels} onChange={setPopularHostels} label="Popular Hostels" description="If enabled, Popular Hostels section will be available on the User App & website." />
              <Toggle checked={newListings} onChange={setNewListings} label="New Listings" description="If enabled, New Listings section will be visible on the user app." />
              <Toggle checked={topRated} onChange={setTopRated} label="Top Rated" description="If enabled, Top Rated section will be visible on the user app." />
            </div>
          </div>
          <SaveBtn onClick={() => handleSave("toggles")} />
        </div>
      )}

      {/* ═══════════════════ THEME ═══════════════════ */}
      {tab === "theme" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">User App Theme</h3>
              <p className="text-xs text-gray-500 mt-0.5">Choose a theme for the user app. Users will see the view according to the theme selected here.</p>
            </div>
            <div className="p-6">
              <ThemeCard value={theme} onChange={setTheme} />
            </div>
          </div>
          <SaveBtn onClick={() => handleSave("theme")} />
        </div>
      )}

      {/* ═══════════════════ LANDING PAGE ═══════════════════ */}
      {tab === "landing" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Landing Page Setup</h3>
              <p className="text-xs text-gray-500 mt-0.5">Setup which type of landing page you want to show to visitors.</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Landing page type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Landing Page</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${landingType === "default" ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="landingType" value="default" checked={landingType === "default"} onChange={() => setLandingType("default")} className="text-indigo-600" />
                      <span className="text-sm font-bold text-gray-900">Default Landing Page</span>
                    </div>
                    <p className="text-xs text-gray-500">Use the built-in landing page that comes with the system.</p>
                  </label>
                  <label className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${landingType === "custom" ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="landingType" value="custom" checked={landingType === "custom"} onChange={() => setLandingType("custom")} className="text-indigo-600" />
                      <span className="text-sm font-bold text-gray-900">Custom Landing Page</span>
                    </div>
                    <p className="text-xs text-gray-500">Redirect to an external landing page via URL.</p>
                  </label>
                </div>
              </div>

              {/* Custom URL (visible when custom is selected) */}
              {landingType === "custom" && (
                <div>
                  <Field label="Landing Page URL" value={landingUrl} onChange={setLandingUrl}
                    placeholder="https://your-landing-page.com" hint="Specify the public URL of your custom landing page. Visitors will be redirected here." />
                </div>
              )}

              {/* Landing page status */}
              <div className="border-t border-gray-100 pt-5">
                <Toggle checked={landingStatus} onChange={setLandingStatus} label="Landing Page Status" description="Enable or disable the landing page. If disabled, visitors will go directly to the login page." />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Currently Using</p>
                    <p className="text-xs text-gray-400 mt-0.5">{landingType === "default" ? "Default Hostel Landing Page" : "Custom Landing Page"}</p>
                  </div>
                  <a href="/" target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-1.5">
                    Visit Landing Page
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <SaveBtn onClick={() => handleSave("landing_page")} />
        </div>
      )}

      {/* ═══════════════════ WEBSITE SETTINGS ═══════════════════ */}
      {tab === "website" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Website Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure website behavior, appearance, and user experience settings.</p>
            </div>
            <div className="p-6 space-y-3">
              <Toggle checked={darkMode} onChange={setDarkMode}
                label="Dark Mode"
                description="Enable dark mode theme on the website. Can reduce eyestrain and save battery on OLED screens." />
              <Toggle checked={cookiesBanner} onChange={setCookiesBanner}
                label="Cookies Banner"
                description="Show a cookie consent banner to visitors. The text is configured from Business Setup > Content Setup." />
              <Toggle checked={guestCheckout} onChange={setGuestCheckout}
                label="Guest Checkout"
                description="Allow users to book rooms without creating an account. If disabled, users must register first." />
              <Toggle checked={websiteLoader} onChange={setWebsiteLoader}
                label="Website Loader"
                description="Show a loading animation while the website content is loading." />
              <Toggle checked={smoothScroll} onChange={setSmoothScroll}
                label="Smooth Scroll"
                description="Enable smooth scrolling animation on the website." />
            </div>
          </div>
          <SaveBtn onClick={() => handleSave("toggles")} />
        </div>
      )}
    </DashboardShell>
  );
}
