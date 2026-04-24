"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

interface OTPProvider { id: number; name: string; slug: string; provider_type: string; description: string | null; color: string; is_active: number; config: Record<string, string>; sort_order: number; }
interface ProviderField { key: string; label: string; type: "text" | "password"; placeholder: string; required?: boolean; }

const PROVIDER_FIELDS: Record<string, ProviderField[]> = {
  twilio: [
    { key: "sid", label: "Sid", type: "text", placeholder: "ACxxxxxxxxx", required: true },
    { key: "messaging_service_sid", label: "Messaging Service Sid", type: "text", placeholder: "MGxxxxxxxxx" },
    { key: "token", label: "Token", type: "password", placeholder: "your_auth_token", required: true },
    { key: "from", label: "From", type: "text", placeholder: "+1234567890", required: true },
    { key: "otp_template", label: "Otp Template", type: "text", placeholder: "Your otp is #OTP#.", required: true },
  ],
  "2factor": [{ key: "api_key", label: "Api Key", type: "text", placeholder: "Enter 2Factor API Key", required: true }],
  msg91: [
    { key: "template_id", label: "Template Id", type: "text", placeholder: "Enter MSG91 template ID", required: true },
    { key: "auth_key", label: "Auth Key", type: "password", placeholder: "Enter MSG91 auth key", required: true },
  ],
  nexmo: [
    { key: "api_key", label: "Api Key", type: "text", placeholder: "Enter Nexmo API Key", required: true },
    { key: "api_secret", label: "Api Secret", type: "password", placeholder: "Enter Nexmo API Secret", required: true },
    { key: "token", label: "Token", type: "password", placeholder: "Enter token" },
    { key: "from", label: "From", type: "text", placeholder: "Hostel", required: true },
    { key: "otp_template", label: "Otp Template", type: "text", placeholder: "Your otp is #OTP#.", required: true },
  ],
  alphanet: [
    { key: "api_key", label: "Api Key", type: "text", placeholder: "Enter Alphanet API Key", required: true },
    { key: "otp_template", label: "Otp Template", type: "text", placeholder: "Your Security Pin is #OTP#", required: true },
  ],
};

const PI: Record<string, React.ReactNode> = {
  twilio: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
  "2factor": <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>,
  msg91: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="8" cy="10" r="1.5"/><circle cx="12" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/></svg>,
  nexmo: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
  alphanet: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
};

type Tab = "sms" | "social" | "mail" | "map" | "recaptcha" | "payment" | "language";

function Inp({ label, value, onChange, type = "text", placeholder = "", required = false, mono = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; mono?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={"w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all " + (mono ? "font-mono" : "")} />
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col items-end gap-1 cursor-pointer shrink-0">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
        <div className={"w-12 h-6 rounded-full transition-colors " + (checked ? "bg-green-500" : "bg-gray-300") + " " + (disabled ? "opacity-50" : "")} />
        <div className={"absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform " + (checked ? "translate-x-6" : "")} />
      </div>
      <span className="text-[10px] text-gray-400 uppercase">{checked ? "ON" : "OFF"}</span>
    </label>
  );
}

export default function AdminSettings() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<OTPProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("sms");
  const [user, setUser] = useState<any>(null);
  const [editConfigs, setEditConfigs] = useState<Record<number, Record<string, string>>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Social
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleActive, setGoogleActive] = useState(false);
  const [facebookClientId, setFacebookClientId] = useState("");
  const [facebookClientSecret, setFacebookClientSecret] = useState("");
  const [facebookActive, setFacebookActive] = useState(false);
  const [appleClientId, setAppleClientId] = useState("");
  const [appleTeamId, setAppleTeamId] = useState("");
  const [appleKeyId, setAppleKeyId] = useState("");
  const [appleServiceFile, setAppleServiceFile] = useState("");
  const [appleServiceFileName, setAppleServiceFileName] = useState("");
  const [appleActive, setAppleActive] = useState(false);

  // Mail
  const [mailMailerName, setMailMailerName] = useState("");
  const [mailHost, setMailHost] = useState("");
  const [mailDriver, setMailDriver] = useState("SMTP");
  const [mailPort, setMailPort] = useState("465");
  const [mailUsername, setMailUsername] = useState("");
  const [mailEmail, setMailEmail] = useState("");
  const [mailEncryption, setMailEncryption] = useState("SSL");
  const [mailPassword, setMailPassword] = useState("");
  const [mailActive, setMailActive] = useState(false);
  const [mailTesting, setMailTesting] = useState(false);
  const [showTestMail, setShowTestMail] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testSubject, setTestSubject] = useState("");
  const [testMessage, setTestMessage] = useState("");

  // Map
  const [mapClientKey, setMapClientKey] = useState("");
  const [mapServerKey, setMapServerKey] = useState("");

  // reCAPTCHA
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState("");
  const [recaptchaActive, setRecaptchaActive] = useState(false);

  // Language
  const [languages, setLanguages] = useState<any[]>([]);
  const [showAddLang, setShowAddLang] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");
  const [newLangDir, setNewLangDir] = useState("ltr");
  const [langTransCode, setLangTransCode] = useState<string | null>(null);
  const [translations, setTranslations] = useState<any[]>([]);
  const [transSearch, setTransSearch] = useState("");
  const [editTransKey, setEditTransKey] = useState<string | null>(null);
  const [editTransValue, setEditTransValue] = useState("");

  // Payment
  const [gateways, setGateways] = useState<any[]>([]);
  const [gwConfigs, setGwConfigs] = useState<Record<number, Record<string, string>>>({});
  const [gwExpandedId, setGwExpandedId] = useState<number | null>(null);

  useEffect(() => { setUser(getCurrentUser()); Promise.all([fetchProviders(), fetchSettings(), fetchGateways(), fetchLanguages()]); }, []);

  const fetchProviders = async () => {
    try {
      const res = await apiFetch("/api/otp-providers");
      if (res.success && res.data.providers) {
        setProviders(res.data.providers);
        const c: Record<number, Record<string, string>> = {};
        res.data.providers.forEach((p: OTPProvider) => { c[p.id] = { ...(p.config || {}) }; });
        setEditConfigs(c);
        if (res.data.providers.length > 0) setExpandedId(res.data.providers[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/settings");
      if (res.success) {
        res.data.forEach((s: any) => {
          const k = s.setting_key, v = s.setting_value, a = s.is_active === 1;
          if (k === "google_client_id") setGoogleClientId(v || "");
          if (k === "google_client_secret") setGoogleClientSecret(v || "");
          if (k === "google_is_active") setGoogleActive(v === "1");
          if (k === "facebook_client_id") setFacebookClientId(v || "");
          if (k === "facebook_client_secret") setFacebookClientSecret(v || "");
          if (k === "facebook_is_active") setFacebookActive(v === "1");
          if (k === "apple_client_id") setAppleClientId(v || "");
          if (k === "apple_team_id") setAppleTeamId(v || "");
          if (k === "apple_key_id") setAppleKeyId(v || "");
          if (k === "apple_service_file") setAppleServiceFile(v || "");
          if (k === "apple_is_active") setAppleActive(v === "1");
          if (k === "mail_mailer_name") setMailMailerName(v || "");
          if (k === "mail_host") { setMailHost(v || ""); setMailActive(a); }
          if (k === "mail_driver") setMailDriver(v || "SMTP");
          if (k === "mail_port") setMailPort(v || "465");
          if (k === "mail_username") setMailUsername(v || "");
          if (k === "mail_email") setMailEmail(v || "");
          if (k === "mail_encryption") setMailEncryption(v || "SSL");
          if (k === "mail_password") setMailPassword(v || "");
          if (k === "map_api_key_client") setMapClientKey(v || "");
          if (k === "map_api_key_server") setMapServerKey(v || "");
          if (k === "recaptcha_site_key") { setRecaptchaSiteKey(v || ""); setRecaptchaActive(a); }
          if (k === "recaptcha_secret_key") setRecaptchaSecretKey(v || "");
        });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const msg = (type: "success" | "error", text: string) => setMessage({ type, text });
  const clearMsg = () => setMessage(null);

  // -- SMS --
  const toggleProvider = async (id: number, isActive: boolean) => {
    setSaving(id); clearMsg();
    try {
      const res = await apiFetch(`/api/otp-providers/${id}/toggle`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) });
      res.success ? (msg("success", `✅ ${res.data.name} ${isActive ? "activated" : "deactivated"}!`), fetchProviders()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const saveProvider = async (p: OTPProvider) => {
    setSaving(p.id); clearMsg();
    try {
      const res = await apiFetch(`/api/otp-providers/${p.id}`, { method: "PUT", body: JSON.stringify({ config: editConfigs[p.id] || {} }) });
      res.success ? (msg("success", `✅ ${p.name} saved!`), fetchProviders()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const updateCfg = (pid: number, k: string, v: string) => setEditConfigs(p => ({ ...p, [pid]: { ...p[pid], [k]: v } }));
  const isDirty = (p: OTPProvider) => JSON.stringify(p.config || {}) !== JSON.stringify(editConfigs[p.id] || {});

  // -- Social --
  // -- Login Setup -- moved to /admin/login-setup

  const saveGoogle = async () => {
    setSaving(-10); clearMsg();
    try {
      const res = await apiFetch("/api/settings/social", { method: "PUT", body: JSON.stringify({ settings: {
        google: { client_id: googleClientId, client_secret: googleClientSecret, is_active: googleActive ? "1" : "0" },
      }})});
      res.success ? (msg("success", "✅ Google settings saved!"), fetchSettings()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const saveFacebook = async () => {
    setSaving(-11); clearMsg();
    try {
      const res = await apiFetch("/api/settings/social", { method: "PUT", body: JSON.stringify({ settings: {
        facebook: { client_id: facebookClientId, client_secret: facebookClientSecret, is_active: facebookActive ? "1" : "0" },
      }})});
      res.success ? (msg("success", "✅ Facebook settings saved!"), fetchSettings()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const saveApple = async () => {
    setSaving(-12); clearMsg();
    try {
      const res = await apiFetch("/api/settings/social", { method: "PUT", body: JSON.stringify({ settings: {
        apple: { client_id: appleClientId, team_id: appleTeamId, key_id: appleKeyId, service_file: appleServiceFile, is_active: appleActive ? "1" : "0" },
      }})});
      res.success ? (msg("success", "✅ Apple settings saved!"), fetchSettings()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };

  // -- Mail --
  const saveMail = async () => {
    setSaving(-2); clearMsg();
    try {
      const res = await apiFetch("/api/settings/mail", { method: "PUT", body: JSON.stringify({ mailerName: mailMailerName, host: mailHost, driver: mailDriver, port: mailPort, username: mailUsername, email: mailEmail, encryption: mailEncryption, password: mailPassword, isActive: mailActive }) });
      res.success ? (msg("success", "✅ Mail settings saved!"), fetchSettings()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const sendTestMail = async () => {
    if (!testTo || !testSubject || !testMessage) { msg("error", "Please fill all fields"); return; }
    setMailTesting(true); clearMsg();
    try {
      const res = await apiFetch("/api/settings/mail-test", { method: "POST", body: JSON.stringify({ to: testTo, subject: testSubject, message: testMessage }) });
      if (res.success) { msg("success", res.message || "✅ Email sent!"); setShowTestMail(false); setTestTo(""); setTestSubject(""); setTestMessage(""); }
      else msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setMailTesting(false); }
  };

  // -- Map --
  const saveMap = async () => {
    setSaving(-3); clearMsg();
    try {
      const res = await apiFetch("/api/settings/map", { method: "PUT", body: JSON.stringify({ clientKey: mapClientKey, serverKey: mapServerKey }) });
      res.success ? (msg("success", "✅ Map API saved!"), fetchSettings()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };

  // -- reCAPTCHA --
  const saveRecaptcha = async () => {
    setSaving(-5); clearMsg();
    try {
      const res = await apiFetch("/api/settings/recaptcha", { method: "PUT", body: JSON.stringify({ siteKey: recaptchaSiteKey, secretKey: recaptchaSecretKey, isActive: recaptchaActive }) });
      res.success ? (msg("success", "✅ reCAPTCHA settings saved!"), fetchSettings()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };

  // -- Payment Gateways --
  const fetchGateways = async () => {
    try {
      const res = await apiFetch("/api/payment-gateways");
      if (res.success) { setGateways(res.data); const c: Record<number, Record<string, string>> = {}; res.data.forEach((g: any) => { c[g.id] = { ...(g.config || {}) }; }); setGwConfigs(c); if (res.data.length > 0 && !gwExpandedId) setGwExpandedId(res.data[0].id); }
    } catch (e) { console.error(e); }
  };
  const toggleGateway = async (id: number, isActive: boolean) => {
    setSaving(id); clearMsg();
    try {
      const res = await apiFetch(`/api/payment-gateways/${id}/toggle`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) });
      res.success ? (msg("success", `✅ ${res.data.name} ${isActive ? "activated" : "deactivated"}!`), fetchGateways()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const saveGateway = async (g: any) => {
    setSaving(g.id); clearMsg();
    try {
      const res = await apiFetch(`/api/payment-gateways/${g.id}`, { method: "PUT", body: JSON.stringify({ config: gwConfigs[g.id] || {}, mode: g.mode, gateway_title: g.gateway_title }) });
      res.success ? (msg("success", `✅ ${g.name} saved!`), fetchGateways()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const updateGwCfg = (gid: number, k: string, v: string) => setGwConfigs(p => ({ ...p, [gid]: { ...p[gid], [k]: v } }));
  const isGwDirty = (g: any) => JSON.stringify(g.config || {}) !== JSON.stringify(gwConfigs[g.id] || {});

  const GW_ICONS: Record<string, React.ReactNode> = {
    mercadopago: <span className="text-2xl">💳</span>, liqpay: <span className="text-2xl">💰</span>, paypal: <span className="text-2xl">🅿️</span>,
    paytm: <span className="text-2xl">💵</span>, paytabs: <span className="text-2xl">📋</span>, bkash: <span className="text-2xl">🏦</span>,
    stripe: <span className="text-2xl">💳</span>, razorpay: <span className="text-2xl">⚡</span>, senangpay: <span className="text-2xl">💲</span>,
    paymob: <span className="text-2xl">🏪</span>, flutterwave: <span className="text-2xl">🦋</span>, paystack: <span className="text-2xl">📐</span>,
    sslcommerz: <span className="text-2xl">🔒</span>,
  };

  // -- Language --
  const fetchLanguages = async () => {
    try {
      const res = await apiFetch("/api/languages");
      if (res.success) setLanguages(res.data);
    } catch (e) { console.error(e); }
  };
  const addLang = async () => {
    if (!newLangCode) return;
    setSaving(-6); clearMsg();
    try {
      const res = await apiFetch("/api/languages", { method: "POST", body: JSON.stringify({ code: newLangCode, direction: newLangDir }) });
      res.success ? (msg("success", `✅ ${res.data.name} added!`), setShowAddLang(false), setNewLangCode(""), fetchLanguages()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };
  const toggleLang = async (code: string, isActive: boolean) => {
    clearMsg();
    try {
      const res = await apiFetch(`/api/languages/${code}/toggle`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) });
      res.success ? (msg("success", `✅ Updated!`), fetchLanguages()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); }
  };
  const setDefaultLang = async (code: string) => {
    clearMsg();
    try {
      const res = await apiFetch(`/api/languages/${code}/default`, { method: "PATCH" });
      res.success ? (msg("success", `✅ Default changed!`), fetchLanguages()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); }
  };
  const deleteLang = async (code: string) => {
    if (!confirm(`Delete language "${code}"? All translations will be lost.`)) return;
    clearMsg();
    try {
      const res = await apiFetch(`/api/languages/${code}`, { method: "DELETE" });
      res.success ? (msg("success", `✅ Deleted!`), fetchLanguages()) : msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); }
  };
  const editLangDir = async (code: string, direction: string) => {
    clearMsg();
    try {
      await apiFetch(`/api/languages/${code}`, { method: "PUT", body: JSON.stringify({ direction }) });
      fetchLanguages();
    } catch {}
  };
  const openTranslations = async (code: string) => {
    setLangTransCode(code); setTransSearch("");
    try {
      const res = await apiFetch(`/api/languages/${code}/translations`);
      if (res.success) setTranslations(res.data);
    } catch (e) { console.error(e); }
  };
  const searchTranslations = async (code: string, q: string) => {
    setTransSearch(q);
    try {
      const res = await apiFetch(`/api/languages/${code}/translations?search=${encodeURIComponent(q)}`);
      if (res.success) setTranslations(res.data);
    } catch {}
  };
  const saveTranslation = async (code: string, key: string, value: string) => {
    try {
      await apiFetch(`/api/languages/${code}/translations`, { method: "PUT", body: JSON.stringify({ key, value }) });
      setEditTransKey(null);
      openTranslations(code);
    } catch {}
  };
  const autoTranslateKey = async (code: string, key: string) => {
    try {
      const res = await apiFetch(`/api/languages/${code}/auto-translate`, { method: "POST", body: JSON.stringify({ key }) });
      if (res.success) { msg("success", `Translated: ${res.data.value}`); openTranslations(code); }
    } catch {}
  };
  const autoTranslateAll = async (code: string) => {
    setSaving(-7); clearMsg();
    try {
      const res = await apiFetch(`/api/languages/${code}/auto-translate-all`, { method: "POST" });
      res.success ? msg("success", `✅ Auto-translated ${res.data.count} strings!`) : msg("error", "Failed");
      openTranslations(code);
    } catch { msg("error", "Network error"); } finally { setSaving(null); }
  };

  const activeProvider = providers.find(p => p.is_active === 1);

  const SaveBtn = ({ onClick, id, label = "Save" }: { onClick: () => void; id: number; label?: string }) => (
    <button onClick={onClick} disabled={saving === id} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50`}>
      {saving === id ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{label}</>}
    </button>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "sms", label: t("sms_module", "SMS Module"), color: "indigo", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
    { key: "social", label: t("social_login", "Social Login"), color: "purple", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { key: "mail", label: t("mail_config", "Mail Config"), color: "rose", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { key: "map", label: t("map_api", "Map API"), color: "emerald", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { key: "recaptcha", label: t("recaptcha", "reCAPTCHA"), color: "amber", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { key: "payment", label: t("payment", "Payment"), color: "teal", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { key: "language", label: t("language", "Language"), color: "sky", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg> },
  ];

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("system_settings", "System Settings")}</h1>
        <p className="text-gray-500 mt-1">{t("configure_sms_providers", "Configure SMS, Social Login, Mail, Map & Security settings")}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); clearMsg(); }} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === t.key ? `bg-${t.color}-600 text-white shadow-lg shadow-${t.color}-600/20` : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
            {t.icon}{t.label}
            {t.key === "sms" && activeProvider && <span className="ml-0.5 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">ACTIVE</span>}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {loading ? <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><p className="text-gray-400">Loading...</p></div> : <>

      {/* ===================== SMS MODULE ===================== */}
      {tab === "sms" && <div>
        <div className={`mb-6 rounded-xl p-4 flex items-center gap-3 ${activeProvider ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeProvider ? "bg-green-100" : "bg-amber-100"}`}>
            {activeProvider ? <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> : <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
          </div>
          <div className="flex-1"><p className={`text-sm font-semibold ${activeProvider ? "text-green-800" : "text-amber-800"}`}>{activeProvider ? `Active: ${activeProvider.name}` : "No SMS provider active"}</p><p className={`text-xs mt-0.5 ${activeProvider ? "text-green-600" : "text-amber-600"}`}>{activeProvider ? `OTP sent via ${activeProvider.name}` : "Toggle ON a provider to enable"}</p></div>
          {activeProvider && <div className="shrink-0 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</div>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {providers.map(provider => {
            const isExpanded = expandedId === provider.id, isActive = provider.is_active === 1;
            const fields = PROVIDER_FIELDS[provider.provider_type] || [], config = editConfigs[provider.id] || {}, dirty = isDirty(provider);
            return (
              <div key={provider.id} className={`rounded-2xl border-2 transition-all overflow-hidden ${isActive ? "border-green-300 shadow-lg shadow-green-100 ring-1 ring-green-200" : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${provider.color}15`, color: provider.color }}>{PI[provider.provider_type] || PI.alphanet}</div>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="text-lg font-bold text-gray-900">{provider.name}</h3>{isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Active</span>}</div><p className="text-sm text-gray-500">{provider.description}</p></div>
                    <Toggle checked={isActive} onChange={v => toggleProvider(provider.id, v)} disabled={saving === provider.id} />
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs"><span className={`w-1.5 h-1.5 rounded-full ${fields.every(f => config[f.key]) ? "bg-green-500" : "bg-gray-300"}`} /><span className="text-gray-500">{fields.every(f => config[f.key]) ? "Configured" : "Not configured"}</span></div>
                    <button onClick={() => setExpandedId(isExpanded ? null : provider.id)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-auto">{isExpanded ? "Close" : "Configure"}<svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                  </div>
                </div>
                {isExpanded && <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                  <div className="space-y-3">{fields.map(f => (<div key={f.key}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label><input type={f.type} value={config[f.key] || ""} onChange={e => updateCfg(provider.id, f.key, e.target.value)} placeholder={f.placeholder} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" /></div>))}</div>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                    <button onClick={() => saveProvider(provider)} disabled={saving === provider.id} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${dirty ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      {saving === provider.id ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}Save
                    </button>
                    {dirty && <span className="text-xs text-amber-600 font-medium">⚠ Unsaved</span>}
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><p className="text-sm font-medium text-indigo-800">How it works</p><p className="text-xs text-indigo-600 mt-1">Only <strong>one provider</strong> active at a time. Use <code className="bg-indigo-100 px-1 rounded">#OTP#</code> in templates.</p></div>
        </div>
      </div>}

      {/* ===================== SOCIAL LOGIN ===================== */}
      {tab === "social" && <div className="max-w-2xl space-y-5">
        {/* Google Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">G</div>
              <div><h3 className="font-bold text-gray-900">Google</h3><p className="text-xs text-gray-400">OAuth 2.0 Login</p></div>
            </div>
            <Toggle checked={googleActive} onChange={setGoogleActive} />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-end">
              <button type="button" onClick={() => { const m = document.getElementById("google-setup-modal"); if (m) (m as any).showModal(); }} className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Credential Setup
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs"><span className="text-gray-500 font-medium">Callback URL</span><p className="font-mono text-gray-700 mt-0.5 select-all break-all">{typeof window !== "undefined" ? window.location.origin : ""}/customer/auth/login/google/callback</p></div>
            <Inp label="Client id" value={googleClientId} onChange={setGoogleClientId} placeholder="xxxx.apps.googleusercontent.com" required mono />
            <Inp label="Client secret" value={googleClientSecret} onChange={setGoogleClientSecret} type="password" placeholder="GOCSPX-xxxx" required />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => { setGoogleClientId(""); setGoogleClientSecret(""); }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Reset</button>
              <button onClick={saveGoogle} disabled={saving === -10} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
                {saving === -10 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}Save
              </button>
            </div>
          </div>
        </div>

        {/* Facebook Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">f</div>
              <div><h3 className="font-bold text-gray-900">Facebook</h3><p className="text-xs text-gray-400">Facebook Login</p></div>
            </div>
            <Toggle checked={facebookActive} onChange={setFacebookActive} />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-end">
              <button type="button" onClick={() => { const m = document.getElementById("facebook-setup-modal"); if (m) (m as any).showModal(); }} className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Credential Setup
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs"><span className="text-gray-500 font-medium">Callback URL</span><p className="font-mono text-gray-700 mt-0.5 select-all break-all">{typeof window !== "undefined" ? window.location.origin : ""}/customer/auth/login/facebook/callback</p></div>
            <Inp label="Client id" value={facebookClientId} onChange={setFacebookClientId} placeholder="Facebook App ID" required mono />
            <Inp label="Client secret" value={facebookClientSecret} onChange={setFacebookClientSecret} type="password" placeholder="Facebook App Secret" required />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => { setFacebookClientId(""); setFacebookClientSecret(""); }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Reset</button>
              <button onClick={saveFacebook} disabled={saving === -11} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
                {saving === -11 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}Save
              </button>
            </div>
          </div>
        </div>

        {/* Apple Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">🍎</div>
              <div><h3 className="font-bold text-gray-900">Apple</h3><p className="text-xs text-gray-400">Sign in with Apple</p></div>
            </div>
            <Toggle checked={appleActive} onChange={setAppleActive} />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-end">
              <button type="button" onClick={() => { const m = document.getElementById("apple-setup-modal"); if (m) (m as any).showModal(); }} className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Credential Setup
              </button>
            </div>
            <Inp label="Client id" value={appleClientId} onChange={setAppleClientId} placeholder="com.example.app" required mono />
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Team id" value={appleTeamId} onChange={setAppleTeamId} placeholder="ABC123DEFG" required mono />
              <Inp label="Key id" value={appleKeyId} onChange={setAppleKeyId} placeholder="A1B2C3D4E5" required mono />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service file <span className="text-red-500">*</span> {appleServiceFile && <span className="text-green-600 font-normal">(Already Exists)</span>}</label>
              <input type="file" accept=".p8" onChange={e => { const f = e.target.files?.[0]; if (f) { setAppleServiceFileName(f.name); const r = new FileReader(); r.onload = ev => setAppleServiceFile(ev.target?.result as string || ""); r.readAsText(f); } }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => { setAppleClientId(""); setAppleTeamId(""); setAppleKeyId(""); setAppleServiceFile(""); setAppleServiceFileName(""); }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Reset</button>
              <button onClick={saveApple} disabled={saving === -12} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
                {saving === -12 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}Save
              </button>
            </div>
          </div>
        </div>

        {/* Credential Setup Modals */}
        <dialog id="google-setup-modal" className="rounded-2xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Google API Setup Instructions</h3>
              <button onClick={() => { const m = document.getElementById("google-setup-modal"); if (m) (m as any).close(); }} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-600 underline">Credentials page</a></li>
              <li>Click <strong>Create Credentials</strong> &gt; <strong>OAuth Client ID</strong></li>
              <li>Select <strong>Web Application</strong> type</li>
              <li>Name your OAuth client</li>
              <li>Click <strong>Add URI</strong> from Authorized Redirect URis, provide the Callback URL from above and click <strong>Created</strong></li>
              <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong>, paste in the fields above and <strong>Save</strong></li>
            </ol>
            <button onClick={() => { const m = document.getElementById("google-setup-modal"); if (m) (m as any).close(); }} className="mt-5 w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Got It</button>
          </div>
        </dialog>

        <dialog id="facebook-setup-modal" className="rounded-2xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Facebook API Setup Instructions</h3>
              <button onClick={() => { const m = document.getElementById("facebook-setup-modal"); if (m) (m as any).close(); }} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" className="text-blue-600 underline">Facebook Developer page</a></li>
              <li>Click <strong>Create App</strong> &gt; select app type &gt; <strong>Next</strong></li>
              <li>Complete the details form and press <strong>Create App</strong></li>
              <li>From <strong>Facebook Login</strong> press <strong>Set Up</strong>, select <strong>Web</strong></li>
              <li>Provide your <strong>Site URL</strong> and <strong>Save</strong></li>
              <li>Make sure <strong>Client OAuth Login</strong> is ON in Settings</li>
              <li>Provide the <strong>Valid OAuth Redirect URIs</strong> from above and <strong>Save Changes</strong></li>
              <li>Copy <strong>App ID</strong> and <strong>App Secret</strong>, paste above and <strong>Save</strong></li>
            </ol>
            <button onClick={() => { const m = document.getElementById("facebook-setup-modal"); if (m) (m as any).close(); }} className="mt-5 w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Got It</button>
          </div>
        </dialog>

        <dialog id="apple-setup-modal" className="rounded-2xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Apple API Setup Instructions</h3>
              <button onClick={() => { const m = document.getElementById("apple-setup-modal"); if (m) (m as any).close(); }} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to <a href="https://developer.apple.com/account/resources/identifiers/list" target="_blank" className="text-blue-600 underline">Apple Developer page</a></li>
              <li>In top left corner you can see the <strong>Team ID</strong></li>
              <li>Click Plus icon &gt; select <strong>App IDs</strong> &gt; click <strong>Continue</strong></li>
              <li>Put description and identifier — this is the <strong>Client ID</strong></li>
              <li>Click Continue and download the <strong>AuthKey_ID.p8</strong> file</li>
              <li>Again click Plus &gt; select <strong>Service IDs</strong> &gt; Continue</li>
              <li>Download the file named <strong>AuthKey_KeyID.p8</strong> — the part after AuthKey is the <strong>Key ID</strong></li>
            </ol>
            <button onClick={() => { const m = document.getElementById("apple-setup-modal"); if (m) (m as any).close(); }} className="mt-5 w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Got It</button>
          </div>
        </dialog>
      </div>}


      {/* ===================== MAIL CONFIG ===================== */}
      {tab === "mail" && <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
              <div><h3 className="text-lg font-bold text-gray-900">Mail Config</h3><p className="text-sm text-gray-500">Configure SMTP for sending emails</p></div>
            </div>
            <button onClick={() => setShowTestMail(true)} className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Send Test Mail</button>
          </div>
          <div className="mb-5 bg-rose-50 border border-rose-100 rounded-xl p-3"><p className="text-xs text-rose-800 font-semibold">How it Works</p><p className="text-[11px] text-rose-600 mt-0.5">Configure SMTP. All system emails go through this server.</p></div>
          <div className="flex items-center justify-between mb-5 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div><p className="text-sm font-semibold text-gray-900">Mail Status <span className="text-rose-600">Turn {mailActive ? "OFF" : "ON"}</span></p><p className="text-xs text-gray-400">*By Turning OFF, all mailing services will be disabled.</p></div>
            <Toggle checked={mailActive} onChange={setMailActive} />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><Inp label="Mailer name" value={mailMailerName} onChange={setMailMailerName} placeholder="SVEats" required /><Inp label="Host" value={mailHost} onChange={setMailHost} placeholder="mail.example.com" required mono /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Driver</label><select value={mailDriver} onChange={e => setMailDriver(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-rose-500/30"><option value="SMTP">SMTP</option><option value="Mail">Mail</option><option value="Sendmail">Sendmail</option></select></div>
              <Inp label="Port" value={mailPort} onChange={setMailPort} placeholder="465" required />
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label><select value={mailEncryption} onChange={e => setMailEncryption(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-rose-500/30"><option value="SSL">SSL</option><option value="TLS">TLS</option><option value="None">None</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4"><Inp label="Username" value={mailUsername} onChange={setMailUsername} placeholder="info@example.com" required mono /><Inp label="Email id" value={mailEmail} onChange={setMailEmail} placeholder="info@example.com" required mono /></div>
            <Inp label="Password" value={mailPassword} onChange={setMailPassword} type="password" placeholder="Enter SMTP password" required />
          </div>
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100"><SaveBtn onClick={saveMail} id={-2} /><span className="text-xs text-gray-400">{mailActive ? "🟢 Active" : "🔴 Disabled"}</span></div>
        </div>
      </div>}

      {/* ===================== MAP API ===================== */}
      {tab === "map" && <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
            <div><h3 className="text-lg font-bold text-gray-900">Google Map API Setup</h3><p className="text-sm text-gray-500">Enter Your Map Credentials</p></div>
          </div>
          <div className="space-y-4">
            <Inp label="Map api key (Client)" value={mapClientKey} onChange={setMapClientKey} placeholder="AIzaSy..." required mono />
            <p className="text-xs text-gray-400 -mt-2">Used in frontend (browser). Restricted to your domain.</p>
            <Inp label="Map api key (Server)" value={mapServerKey} onChange={setMapServerKey} placeholder="AIzaSy..." required mono />
            <p className="text-xs text-gray-400 -mt-2">Used in backend (server-side). Restricted to your server IP.</p>
          </div>
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100"><SaveBtn onClick={saveMap} id={-3} /><span className="text-xs text-gray-400">{(mapClientKey || mapServerKey) ? "🟢 Keys set" : "🔴 No keys"}</span></div>
        </div>
      </div>}

      {/* ===================== reCAPTCHA ===================== */}
      {tab === "recaptcha" && <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
            <div><h3 className="text-lg font-bold text-gray-900">Google reCAPTCHA Information</h3><p className="text-sm text-gray-500">Protect forms from spam and abuse</p></div>
          </div>
          <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-800 font-semibold">V3 Version is available now. Must setup for ReCAPTCHA V3</p>
            <p className="text-[11px] text-amber-600 mt-0.5">You must setup for V3 version. Otherwise the default reCAPTCHA will be displayed automatically</p>
          </div>
          <div className="flex items-center justify-between mb-5 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div><p className="text-sm font-semibold text-gray-900">ReCAPTCHA Status <span className="text-amber-600">Turn {recaptchaActive ? "OFF" : "ON"}</span></p></div>
            <Toggle checked={recaptchaActive} onChange={setRecaptchaActive} />
          </div>
          <div className="space-y-4">
            <Inp label="Site Key" value={recaptchaSiteKey} onChange={setRecaptchaSiteKey} placeholder="6Ld..." required mono />
            <Inp label="Secret Key" value={recaptchaSecretKey} onChange={setRecaptchaSecretKey} type="password" placeholder="6Ld..." required mono />
          </div>
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={saveRecaptcha} disabled={saving === -5} className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20">
              {saving === -5 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}Save
            </button>
            <span className="text-xs text-gray-400">{recaptchaActive ? "🟢 Active" : "🔴 Disabled"}</span>
          </div>
        </div>
      </div>}


      {/* ===================== PAYMENT GATEWAYS ===================== */}
      {tab === "payment" && <div>
        <div className={`mb-6 rounded-xl p-4 flex items-center gap-3 ${gateways.some(g => g.is_active === 1) ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${gateways.some(g => g.is_active === 1) ? "bg-green-100" : "bg-amber-100"}`}>
            {gateways.some(g => g.is_active === 1)
              ? <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              : <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${gateways.some(g => g.is_active === 1) ? "text-green-800" : "text-amber-800"}`}>
              {gateways.some(g => g.is_active === 1) ? `${gateways.filter(g => g.is_active === 1).length} gateway(s) active` : "No digital payment method active"}
            </p>
            <p className={`text-xs mt-0.5 ${gateways.some(g => g.is_active === 1) ? "text-green-600" : "text-amber-600"}`}>
              {gateways.some(g => g.is_active === 1) ? "Users can pay via digital payments" : "Activate at least one gateway to enable digital payments"}
            </p>
          </div>
          {gateways.some(g => g.is_active === 1) && <div className="shrink-0 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</div>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {gateways.map(gw => {
            const isExpanded = gwExpandedId === gw.id, isActive = gw.is_active === 1;
            const config = gwConfigs[gw.id] || {}, dirty = isGwDirty(gw);
            const fields = Object.keys(config);
            const fieldLabels: Record<string, string> = {
              access_token: "Access Token", private_key: "Private Key", public_key: "Public Key",
              client_id: "Client Id", client_secret: "Client Secret", merchant_key: "Merchant Key",
              merchant_id: "Merchant Id", merchant_website_link: "Merchant Website Link",
              profile_id: "Profile Id", server_key: "Server Key", base_url: "Base Url",
              app_key: "App Key", app_secret: "App Secret", username: "Username", password: "Password",
              api_key: "Api Key", api_secret: "Api Secret", published_key: "Published Key",
              callback_url: "Callback Url", secret_key: "Secret Key", hash: "Hash",
              iframe_id: "Iframe Id", integration_id: "Integration Id", hmac: "Hmac",
              merchant_email: "Merchant Email", store_id: "Store Id", store_password: "Store Password",
            };
            const secretFields = new Set(["access_token", "private_key", "client_secret", "api_secret", "app_secret", "password", "secret_key", "server_key", "store_password", "hmac", "hash"]);
            return (
              <div key={gw.id} className={`rounded-2xl border-2 transition-all overflow-hidden ${isActive ? "border-green-300 shadow-lg shadow-green-100 ring-1 ring-green-200" : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0">{GW_ICONS[gw.slug] || <span className="text-2xl">💳</span>}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{gw.name}</h3>
                        {isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Active</span>}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${gw.mode === "live" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"}`}>{gw.mode}</span>
                      </div>
                      <p className="text-sm text-gray-500">{gw.description}</p>
                    </div>
                    <Toggle checked={isActive} onChange={v => toggleGateway(gw.id, v)} disabled={saving === gw.id} />
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${fields.every(f => config[f]) ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-gray-500">{fields.every(f => config[f]) ? "Configured" : "Not configured"}</span>
                    </div>
                    <button onClick={() => setGwExpandedId(isExpanded ? null : gw.id)} className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 ml-auto">
                      {isExpanded ? "Close" : "Configure"}<svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
                {isExpanded && <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                  <div className="space-y-3">
                    {fields.map(f => (
                      <div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabels[f] || f}<span className="text-red-500 ml-0.5">*</span></label>
                      <input type={secretFields.has(f) ? "password" : "text"} value={config[f] || ""} onChange={e => updateGwCfg(gw.id, f, e.target.value)} placeholder={`Enter ${fieldLabels[f] || f}`} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" /></div>
                    ))}
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment gateway title</label>
                    <input type="text" value={gw.gateway_title || ""} onChange={e => { const ug = [...gateways]; const i = ug.findIndex(x => x.id === gw.id); if (i >= 0) { ug[i] = { ...ug[i], gateway_title: e.target.value }; setGateways(ug); } }} placeholder="Gateway display name" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Choose logo</label>
                    <input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = ev => { const ug = [...gateways]; const i = ug.findIndex(x => x.id === gw.id); if (i >= 0) { ug[i] = { ...ug[i], logo: ev.target?.result as string || "" }; setGateways(ug); } }; r.readAsDataURL(file); } }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                    {gw.logo && <p className="text-xs text-green-600 mt-1">✅ Logo uploaded</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                    <button onClick={() => saveGateway(gw)} disabled={saving === gw.id} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${dirty ? "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      {saving === gw.id ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}Save
                    </button>
                    {dirty && <span className="text-xs text-amber-600 font-medium">⚠ Unsaved</span>}
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
        <div className="mt-6 bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><p className="text-sm font-medium text-teal-800">Digital Payment Methods</p><p className="text-xs text-teal-600 mt-1">Activate gateways that support your target currency. Multiple gateways can be active simultaneously. Users will see all active options at checkout.</p></div>
        </div>
      </div>}

      {/* ===================== LANGUAGE ===================== */}
      {tab === "language" && !langTransCode && <div className="max-w-4xl">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg></div>
              <h3 className="font-bold text-gray-900">Language List</h3>
            </div>
            <button onClick={() => setShowAddLang(true)} className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add New Language</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-600">
                <th className="px-5 py-3 text-left font-semibold">#</th>
                <th className="px-5 py-3 text-left font-semibold">Code</th>
                <th className="px-5 py-3 text-left font-semibold">Language</th>
                <th className="px-5 py-3 text-left font-semibold">Direction</th>
                <th className="px-5 py-3 text-center font-semibold">Status</th>
                <th className="px-5 py-3 text-center font-semibold">Default</th>
                <th className="px-5 py-3 text-center font-semibold">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {languages.map((lang, i) => (
                  <tr key={lang.code} className={`hover:bg-gray-50/50 ${lang.is_default ? "bg-sky-50/30" : ""}`}>
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-mono text-gray-700 font-medium">{lang.code}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{lang.name}</td>
                    <td className="px-5 py-3">
                      <select value={lang.direction} onChange={e => editLangDir(lang.code, e.target.value)} disabled={lang.code === "en"} className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white">
                        <option value="ltr">LTR</option><option value="rtl">RTL</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-center"><Toggle checked={!!lang.is_active} onChange={v => toggleLang(lang.code, v)} /></td>
                    <td className="px-5 py-3 text-center">
                      {lang.is_default ? <span className="px-2.5 py-1 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-full">DEFAULT</span>
                        : <button onClick={() => setDefaultLang(lang.code)} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full hover:bg-sky-50 hover:text-sky-600 transition-all">SET DEFAULT</button>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {lang.code !== "en" && <>
                          <button onClick={() => deleteLang(lang.code)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </>}
                        <button onClick={() => openTranslations(lang.code)} className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg" title="Translate"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><p className="text-sm font-medium text-sky-800">Language Management</p><p className="text-xs text-sky-600 mt-1">Add languages, set direction (LTR/RTL), toggle active/inactive, and mark one as default. Click the globe icon to translate strings.</p></div>
        </div>
      </div>}

      {/* ===================== LANGUAGE TRANSLATE ===================== */}
      {tab === "language" && langTransCode && <div className="max-w-4xl">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => { setLangTransCode(null); setTranslations([]); }} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back</button>
          <h3 className="text-lg font-bold text-gray-900">{languages.find(l => l.code === langTransCode)?.name || langTransCode} Translations</h3>
          <span className="text-xs text-gray-400">{translations.length} strings</span>
          <div className="ml-auto flex items-center gap-2">
            {langTransCode !== "en" && <button onClick={() => autoTranslateAll(langTransCode)} disabled={saving === -7} className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 disabled:opacity-50 flex items-center gap-1">
              {saving === -7 ? <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : "🔄"} Translate All
            </button>}
            <input type="text" value={transSearch} onChange={e => searchTranslations(langTransCode, e.target.value)} placeholder="Search..." className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-48" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-semibold w-8">#</th>
              <th className="px-4 py-3 text-left font-semibold">Key</th>
              <th className="px-4 py-3 text-left font-semibold">Translated Value</th>
              <th className="px-4 py-3 text-center font-semibold w-32">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {translations.map((t, i) => (
                <tr key={t.translation_key} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500 max-w-[200px] truncate" title={t.translation_key}>{t.translation_key}</td>
                  <td className="px-4 py-2">
                    {editTransKey === t.translation_key
                      ? <div className="flex items-center gap-2">
                          <input type="text" value={editTransValue} onChange={e => setEditTransValue(e.target.value)} className="flex-1 px-3 py-1.5 border border-sky-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/30" autoFocus />
                          <button onClick={() => saveTranslation(langTransCode, t.translation_key, editTransValue)} className="px-2 py-1 bg-sky-600 text-white rounded-lg text-xs hover:bg-sky-700">Save</button>
                          <button onClick={() => setEditTransKey(null)} className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs">✕</button>
                        </div>
                      : <span className="text-gray-800 cursor-pointer hover:text-sky-600" onClick={() => { setEditTransKey(t.translation_key); setEditTransValue(t.translation_value || ""); }}>{t.translation_value || <em className="text-gray-300">Click to edit</em>}</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {editTransKey !== t.translation_key && <button onClick={() => { setEditTransKey(t.translation_key); setEditTransValue(t.translation_value || ""); }} className="p-1 text-gray-400 hover:text-sky-600 rounded" title="Edit"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                      {langTransCode !== "en" && <button onClick={() => autoTranslateKey(langTransCode, t.translation_key)} className="p-1 text-gray-400 hover:text-amber-600 rounded" title="Auto-translate"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ===================== ADD LANGUAGE MODAL ===================== */}
      {showAddLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add New Language</h3>
              <button onClick={() => setShowAddLang(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                <select value={newLangCode} onChange={e => setNewLangCode(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400">
                  <option value="">-- Select Language --</option>
                  <option value="af">Afrikaans</option><option value="sq">Albanian</option><option value="ar">Arabic - العربية</option><option value="hy">Armenian</option><option value="az">Azerbaijani</option>
                  <option value="bn">Bengali - বাংলা</option><option value="bg">Bulgarian</option><option value="zh">Chinese - 中文</option><option value="zh-CN">Chinese (Simplified)</option><option value="zh-TW">Chinese (Traditional)</option>
                  <option value="hr">Croatian</option><option value="cs">Czech</option><option value="da">Danish</option><option value="nl">Dutch</option><option value="en">English</option>
                  <option value="et">Estonian</option><option value="fi">Finnish</option><option value="fr">French - français</option><option value="de">German - Deutsch</option><option value="el">Greek</option>
                  <option value="gu">Gujarati - ગુજરાતી</option><option value="he">Hebrew - עברית</option><option value="hi">Hindi - हिन्दी</option><option value="hu">Hungarian</option><option value="id">Indonesian</option>
                  <option value="it">Italian</option><option value="ja">Japanese - 日本語</option><option value="kn">Kannada</option><option value="ko">Korean - 한국어</option><option value="ku">Kurdish</option>
                  <option value="lv">Latvian</option><option value="lt">Lithuanian</option><option value="ms">Malay</option><option value="ml">Malayalam - മലയാളം</option><option value="mr">Marathi - मराठी</option>
                  <option value="mn">Mongolian</option><option value="ne">Nepali - नेपाली</option><option value="no">Norwegian</option><option value="fa">Persian - فارسی</option><option value="pl">Polish</option>
                  <option value="pt">Portuguese</option><option value="pt-BR">Portuguese (Brazil)</option><option value="pa">Punjabi - ਪੰਜਾਬੀ</option><option value="ro">Romanian</option><option value="ru">Russian - русский</option>
                  <option value="sr">Serbian</option><option value="si">Sinhala</option><option value="sk">Slovak</option><option value="sl">Slovenian</option><option value="es">Spanish - español</option>
                  <option value="sw">Swahili</option><option value="sv">Swedish</option><option value="tl">Tagalog</option><option value="ta">Tamil - தமிழ்</option><option value="te">Telugu - తెలుగు</option>
                  <option value="th">Thai - ไทย</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option><option value="ur">Urdu - اردو</option><option value="uz">Uzbek</option>
                  <option value="vi">Vietnamese</option><option value="cy">Welsh</option><option value="zu">Zulu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select value={newLangDir} onChange={e => setNewLangDir(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="ltr">LTR (Left to Right)</option><option value="rtl">RTL (Right to Left)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button onClick={addLang} disabled={!newLangCode || saving === -6} className="flex-1 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving === -6 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}Add Language
              </button>
              <button onClick={() => setShowAddLang(false)} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TEST MAIL MODAL ===================== */}
      {showTestMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                <div><h3 className="text-lg font-bold text-gray-900">Send Test Mail</h3><p className="text-xs text-gray-400">Uses saved SMTP config to send</p></div>
              </div>
              <button onClick={() => setShowTestMail(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
                <input type="email" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="recipient@example.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                <input type="text" value={testSubject} onChange={e => setTestSubject(e.target.value)} placeholder="Test Email from Hostel System" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
                <textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={4} placeholder="<h1>Hello</h1><p>This is a test email.</p>" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 resize-none" />
              </div>
              {message && <div className={`px-3 py-2 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>}
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button onClick={sendTestMail} disabled={mailTesting} className="flex-1 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
                {mailTesting ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Sending...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Send Email</>}
              </button>
              <button onClick={() => setShowTestMail(false)} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
      </>
    }
    </DashboardShell>
  );
}
