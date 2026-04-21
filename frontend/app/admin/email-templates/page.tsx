"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface EmailTemplate {
  id: number;
  title: string | null;
  body: string | null;
  body_2: string | null;
  icon: string | null;
  logo: string | null;
  banner_image: string | null;
  button_name: string | null;
  button_url: string | null;
  footer_text: string | null;
  copyright_text: string | null;
  email_type: string | null;
  template_type: string;
  email_template: string;
  privacy: number;
  refund: number;
  cancelation: number;
  contact: number;
  facebook: number;
  instagram: number;
  twitter: number;
  linkedin: number;
  pinterest: number;
  status: number;
  created_at: string;
  updated_at: string;
}

type Tab = "user" | "admin";

const EMAIL_TYPES: Record<Tab, { key: string; label: string }[]> = {
  user: [
    { key: "registration", label: "Registration" },
    { key: "forgot_password", label: "Forgot Password" },
    { key: "booking_confirmation", label: "Booking Confirmation" },
    { key: "booking_status", label: "Booking Status Update" },
    { key: "registration_otp", label: "Registration OTP" },
    { key: "login_otp", label: "Login OTP" },
  ],
  admin: [
    { key: "registration", label: "Customer Registration" },
    { key: "new_booking", label: "New Booking" },
    { key: "owner_registration", label: "Owner Registration" },
  ],
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>("user");
  const [user, setUser] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Editing state
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    body_2: "",
    button_name: "",
    button_url: "",
    footer_text: "",
    copyright_text: "",
    icon: "",
    logo: "",
    banner_image: "",
    privacy: false,
    refund: false,
    cancelation: false,
    contact: false,
    facebook: false,
    instagram: false,
    twitter: false,
    linkedin: false,
    pinterest: false,
    status: true,
  });

  useEffect(() => {
    setUser(getCurrentUser());
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (tab) fetchTemplates();
  }, [tab]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/email-templates?type=${tab}`);
      if (res.success && res.data) {
        setTemplates(res.data);
        // Auto-select the first template
        if (res.data.length > 0 && (!editTemplate || !res.data.find((t: EmailTemplate) => t.id === editTemplate.id))) {
          selectTemplate(res.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: EmailTemplate) => {
    setEditTemplate(template);
    setFormData({
      title: template.title || "",
      body: template.body || "",
      body_2: template.body_2 || "",
      button_name: template.button_name || "",
      button_url: template.button_url || "",
      footer_text: template.footer_text || "",
      copyright_text: template.copyright_text || "",
      icon: template.icon || "",
      logo: template.logo || "",
      banner_image: template.banner_image || "",
      privacy: !!template.privacy,
      refund: !!template.refund,
      cancelation: !!template.cancelation,
      contact: !!template.contact,
      facebook: !!template.facebook,
      instagram: !!template.instagram,
      twitter: !!template.twitter,
      linkedin: !!template.linkedin,
      pinterest: !!template.pinterest,
      status: !!template.status,
    });
  };

  const handleSave = async () => {
    if (!editTemplate) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch(`/api/email-templates/${editTemplate.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          privacy: formData.privacy ? 1 : 0,
          refund: formData.refund ? 1 : 0,
          cancelation: formData.cancelation ? 1 : 0,
          contact: formData.contact ? 1 : 0,
          facebook: formData.facebook ? 1 : 0,
          instagram: formData.instagram ? 1 : 0,
          twitter: formData.twitter ? 1 : 0,
          linkedin: formData.linkedin ? 1 : 0,
          pinterest: formData.pinterest ? 1 : 0,
          status: formData.status ? 1 : 0,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Email template saved successfully!" });
        fetchTemplates();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!editTemplate) return;
    try {
      const res = await apiFetch(`/api/email-templates/${editTemplate.id}/preview`, {
        method: "POST",
        body: JSON.stringify({
          replacements: {
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            otp: "123456",
            room_name: "Deluxe Room 101",
            check_in: "2025-05-01",
            check_out: "2025-05-05",
            status: "Confirmed",
            amount: "$250.00",
            customer_name: "John Doe",
            hostel_name: "Sunshine Hostel",
          },
        }),
      });
      if (res.success && res.data?.html) {
        setPreviewHtml(res.data.html);
        setShowPreview(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (template: EmailTemplate) => {
    try {
      const res = await apiFetch(`/api/email-templates/${template.id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !template.status }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ Template ${!template.status ? "activated" : "deactivated"}!` });
        fetchTemplates();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to toggle" });
    }
  };

  const handleImageUpload = (field: "icon" | "logo" | "banner_image", file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, [field]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const getFieldLabel = (emailType: string | null) => {
    if (!emailType) return "Email Template";
    const allTypes = [...EMAIL_TYPES.user, ...EMAIL_TYPES.admin];
    return allTypes.find((t) => t.key === emailType)?.label || emailType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const TabButton = ({ tabKey, label, icon }: { tabKey: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => {
        setTab(tabKey);
        setEditTemplate(null);
        setMessage(null);
      }}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
        tab === tabKey ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300"}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  );

  const TextInput = ({
    label,
    value,
    onChange,
    placeholder = "",
    maxLength,
    required = false,
    mono = false,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    mono?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {maxLength && <span className="text-gray-400 text-xs ml-2">({value.length}/{maxLength})</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all ${mono ? "font-mono" : ""}`}
      />
    </div>
  );

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-gray-500 mt-1">Configure email templates for all system notifications</p>
      </div>

      {/* Tab Selector - User / Admin */}
      <div className="flex gap-2 mb-6">
        <TabButton
          tabKey="user"
          label="Customer Templates"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <TabButton
          tabKey="admin"
          label="Admin Templates"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left: Template List ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">{tab === "user" ? "Customer" : "Admin"} Templates</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a template to edit</p>
              </div>
              <div className="divide-y divide-gray-50">
                {EMAIL_TYPES[tab].map((et) => {
                  const template = templates.find((t) => t.email_type === et.key);
                  const isSelected = editTemplate?.email_type === et.key;
                  return (
                    <button
                      key={et.key}
                      onClick={() => template && selectTemplate(template)}
                      className={`w-full text-left px-4 py-3 transition-all flex items-center justify-between gap-2 ${
                        isSelected ? "bg-indigo-50 border-l-4 border-indigo-500" : "hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>{et.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{et.key}</p>
                      </div>
                      <div className="shrink-0">
                        {template?.status ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-full">ON</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-bold rounded-full">OFF</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Template Editor ── */}
          <div className="lg:col-span-9">
            {editTemplate ? (
              <div className="space-y-5">
                {/* Template Header */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{getFieldLabel(editTemplate.email_type)}</h3>
                        <p className="text-xs text-gray-500">
                          Type: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{editTemplate.email_type}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePreview}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                      </button>
                      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
                        <span className="text-xs text-gray-500">Status</span>
                        <Toggle checked={formData.status} onChange={(v) => setFormData((p) => ({ ...p, status: v }))} label={formData.status ? "ON" : "OFF"} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Icon / Logo Upload ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Images
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Icon */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon
                        <span className="text-gray-400 text-xs ml-1">(1:1 ratio)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-all">
                        {formData.icon ? (
                          <div className="relative">
                            <img src={formData.icon} alt="Icon" className="w-16 h-16 object-contain mx-auto rounded-lg" />
                            <button
                              onClick={() => setFormData((p) => ({ ...p, icon: "" }))}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-300">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs">No icon</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload("icon", f);
                          }}
                          className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                        <span className="text-gray-400 text-xs ml-1">(Company logo)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-all">
                        {formData.logo ? (
                          <div className="relative">
                            <img src={formData.logo} alt="Logo" className="h-12 object-contain mx-auto rounded-lg" />
                            <button
                              onClick={() => setFormData((p) => ({ ...p, logo: "" }))}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-300">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs">No logo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload("logo", f);
                          }}
                          className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>

                    {/* Banner */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner Image
                        <span className="text-gray-400 text-xs ml-1">(16:9)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-all">
                        {formData.banner_image ? (
                          <div className="relative">
                            <img src={formData.banner_image} alt="Banner" className="w-full h-20 object-cover mx-auto rounded-lg" />
                            <button
                              onClick={() => setFormData((p) => ({ ...p, banner_image: "" }))}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-300">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs">No banner</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload("banner_image", f);
                          }}
                          className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Header Content ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Header Content
                  </h4>
                  <div className="space-y-4">
                    <TextInput
                      label="Main Title"
                      value={formData.title}
                      onChange={(v) => setFormData((p) => ({ ...p, title: v }))}
                      placeholder="e.g. Your registration was successful!"
                      maxLength={100}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mail Body Message
                        <span className="text-gray-400 text-xs ml-2">(Use HTML, supports {"{{variable}}"} placeholders)</span>
                      </label>
                      <textarea
                        value={formData.body}
                        onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
                        rows={6}
                        placeholder="Hi {{name}},&#10;&#10;Thank you for registering with us!"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-mono resize-y"
                      />
                    </div>
                    {formData.body_2 !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Body 2 (Additional Content)
                          <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                        </label>
                        <textarea
                          value={formData.body_2}
                          onChange={(e) => setFormData((p) => ({ ...p, body_2: e.target.value }))}
                          rows={3}
                          placeholder="Additional content below main body..."
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-mono resize-y"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextInput
                        label="Button Name"
                        value={formData.button_name}
                        onChange={(v) => setFormData((p) => ({ ...p, button_name: v }))}
                        placeholder="e.g. View Booking"
                        maxLength={50}
                      />
                      <TextInput
                        label="Button URL"
                        value={formData.button_url}
                        onChange={(v) => setFormData((p) => ({ ...p, button_url: v }))}
                        placeholder="https://example.com"
                        mono
                      />
                    </div>
                  </div>
                </div>

                {/* ── Footer Content ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Footer Content
                  </h4>
                  <div className="space-y-4">
                    <TextInput
                      label="Footer Text"
                      value={formData.footer_text}
                      onChange={(v) => setFormData((p) => ({ ...p, footer_text: v }))}
                      placeholder="Please contact us for any queries, we are always happy to help."
                      maxLength={200}
                    />
                    <TextInput
                      label="Copyright Text"
                      value={formData.copyright_text}
                      onChange={(v) => setFormData((p) => ({ ...p, copyright_text: v }))}
                      placeholder="Copyright 2025 Hostel. All rights reserved."
                      maxLength={100}
                    />

                    {/* Footer Links */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h5 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Footer Links</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Toggle checked={formData.privacy} onChange={(v) => setFormData((p) => ({ ...p, privacy: v }))} label="Privacy Policy" />
                        <Toggle checked={formData.refund} onChange={(v) => setFormData((p) => ({ ...p, refund: v }))} label="Refund Policy" />
                        <Toggle checked={formData.cancelation} onChange={(v) => setFormData((p) => ({ ...p, cancelation: v }))} label="Cancellation" />
                        <Toggle checked={formData.contact} onChange={(v) => setFormData((p) => ({ ...p, contact: v }))} label="Contact Us" />
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h5 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Social Media Icons</h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Toggle checked={formData.facebook} onChange={(v) => setFormData((p) => ({ ...p, facebook: v }))} label="Facebook" />
                        <Toggle checked={formData.instagram} onChange={(v) => setFormData((p) => ({ ...p, instagram: v }))} label="Instagram" />
                        <Toggle checked={formData.twitter} onChange={(v) => setFormData((p) => ({ ...p, twitter: v }))} label="Twitter" />
                        <Toggle checked={formData.linkedin} onChange={(v) => setFormData((p) => ({ ...p, linkedin: v }))} label="LinkedIn" />
                        <Toggle checked={formData.pinterest} onChange={(v) => setFormData((p) => ({ ...p, pinterest: v }))} label="Pinterest" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Available Variables ── */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Available Variables</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Use these placeholders in title and body:{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{name}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{email}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{otp}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{room_name}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{check_in}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{check_out}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{status}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{amount}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{phone}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{hostel_name}}"}</code>{" "}
                        <code className="bg-amber-100 px-1 rounded">{"{{customer_name}}"}</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Save Button ── */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => editTemplate && selectTemplate(editTemplate)}
                    className="px-6 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
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
                        Save Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-400">Select a Template</h3>
                <p className="text-sm text-gray-300 mt-1">Choose a template from the left panel to start editing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Email Preview</h3>
                  <p className="text-xs text-gray-400">{editTemplate && getFieldLabel(editTemplate.email_type)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto bg-gray-100" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <iframe
                ref={previewRef}
                srcDoc={previewHtml}
                className="w-full bg-white rounded-lg border-0"
                style={{ minHeight: "600px" }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
