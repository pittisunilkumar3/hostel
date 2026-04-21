"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

type FieldType = "text" | "number" | "date" | "email" | "phone" | "file" | "check_box" | "textarea";

interface CustomField {
  field_type: FieldType;
  input_data: string;       // stored as snake_case label
  placeholder_data: string;
  is_required: boolean;
  check_data: string[] | null;
  media_data: {
    image: number; pdf: number; docs: number;
    upload_multiple_files: number;
    file_upload_quantity: number | null;
  } | null;
}

type TabType = "owner" | "customer";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "file", label: "File Upload" },
  { value: "check_box", label: "Checkbox" },
];

const DEFAULT_OWNER_FIELDS = [
  "Hostel Name", "Hostel Type (Boys/Girls/Co-Ed)", "Total Rooms",
  "Price Per Month", "Hostel Address", "City", "State", "Zip Code",
  "Owner First Name", "Owner Last Name", "Phone Number",
  "Email", "Password", "Amenities", "Description",
];

const DEFAULT_CUSTOMER_FIELDS = [
  "Full Name", "Email", "Phone Number", "Password",
];

function prettyName(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JoinUsSetupPage() {
  const [tab, setTab] = useState<TabType>("owner");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setDirty(false);
    try {
      const res = await apiFetch(`/api/join-us-page-setup?type=${tab}`);
      if (res.success && res.data?.data) {
        setFields(res.data.data);
      } else {
        setFields([]);
      }
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  // ---- Field CRUD ----
  const addField = () => {
    setFields((p) => [...p, {
      field_type: "text", input_data: "", placeholder_data: "",
      is_required: false, check_data: null, media_data: null,
    }]);
    setDirty(true);
  };

  const removeField = (idx: number) => {
    setFields((p) => p.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const updateField = (idx: number, patch: Partial<CustomField>) => {
    setFields((p) => p.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, ...patch };
      // Reset check_data/media_data when switching type
      if (patch.field_type && patch.field_type !== f.field_type) {
        if (patch.field_type === "check_box") {
          updated.check_data = [""];
          updated.media_data = null;
          updated.placeholder_data = "";
        } else if (patch.field_type === "file") {
          updated.media_data = { image: 1, pdf: 0, docs: 0, upload_multiple_files: 0, file_upload_quantity: 1 };
          updated.check_data = null;
          updated.placeholder_data = "";
        } else {
          updated.check_data = null;
          updated.media_data = null;
        }
      }
      return updated;
    }));
    setDirty(true);
  };

  const addCheckBoxOption = (idx: number) => {
    setFields((p) => p.map((f, i) => {
      if (i !== idx) return f;
      return { ...f, check_data: [...(f.check_data || []), ""] };
    }));
    setDirty(true);
  };

  const removeCheckBoxOption = (idx: number, optIdx: number) => {
    setFields((p) => p.map((f, i) => {
      if (i !== idx) return f;
      return { ...f, check_data: (f.check_data || []).filter((_, j) => j !== optIdx) };
    }));
    setDirty(true);
  };

  const updateCheckBoxOption = (idx: number, optIdx: number, val: string) => {
    setFields((p) => p.map((f, i) => {
      if (i !== idx) return f;
      const cd = [...(f.check_data || [])];
      cd[optIdx] = val;
      return { ...f, check_data: cd };
    }));
    setDirty(true);
  };

  // ---- Save ----
  const handleSave = async () => {
    // Validate
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].input_data.trim()) {
        setMessage({ type: "error", text: `Field #${i + 1}: Title is required` });
        return;
      }
      if (fields[i].field_type !== "file" && fields[i].field_type !== "check_box" && !fields[i].placeholder_data.trim()) {
        setMessage({ type: "error", text: `Field #${i + 1}: Placeholder is required` });
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/join-us-page-setup", {
        method: "POST",
        body: JSON.stringify({ type: tab, fields }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Saved successfully!" });
        setDirty(false);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const defaultFields = tab === "owner" ? DEFAULT_OWNER_FIELDS : DEFAULT_CUSTOMER_FIELDS;

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Join Us Page Setup</h1>
        <p className="text-gray-500 text-sm mt-1">Configure the registration form fields for the Join Us page</p>
      </div>

      {/* Info Banner */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div className="text-sm text-amber-800">
          All field data displayed on the <a href="/join-us" className="font-semibold text-indigo-600 hover:underline" target="_blank">Join Us Registration Page</a>. Don&apos;t forget to click <strong>Save</strong> to save changes.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["owner", "customer"] as TabType[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setMessage(null); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
            {t === "owner" ? "Hostel Owner Registration Form" : "Customer Registration Form"}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><p className="text-gray-400 text-sm">Loading...</p></div>
      ) : (
        <div className="space-y-6">
          {/* Default Fields Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Default Input Fields</h3>
              <p className="text-xs text-gray-400 mt-0.5">These are the required standard fields that are always collected during registration.</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {defaultFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100">
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Custom Input Fields</h3>
                <p className="text-xs text-gray-400 mt-0.5">Add extra fields to collect additional information during registration.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(!showPreview)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${showPreview ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
                <button onClick={addField}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Add New Field
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {fields.length === 0 && !showPreview && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  <p className="text-gray-400 text-sm">No custom fields yet. Click &quot;Add New Field&quot; to get started.</p>
                </div>
              )}

              {fields.map((field, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative group">
                  {/* Field Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <span className="text-sm font-bold text-gray-500">Field #{idx + 1}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={field.is_required}
                          onChange={(e) => updateField(idx, { is_required: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <span className="text-xs font-medium text-gray-600">Required?</span>
                      </label>
                      <button onClick={() => removeField(idx)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete field">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                      <select value={field.field_type}
                        onChange={(e) => updateField(idx, { field_type: e.target.value as FieldType })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white">
                        {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                      </select>
                    </div>
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Input Field Title <span className="text-red-500">*</span></label>
                      <input type="text" value={prettyName(field.input_data)}
                        onChange={(e) => updateField(idx, { input_data: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                        placeholder="e.g. Enter field title" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                    </div>
                    {/* Placeholder */}
                    {field.field_type !== "file" && field.field_type !== "check_box" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder <span className="text-red-500">*</span></label>
                        <input type="text" value={field.placeholder_data}
                          onChange={(e) => updateField(idx, { placeholder_data: e.target.value })}
                          placeholder="e.g. Enter your name" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* File-specific options */}
                  {field.field_type === "file" && field.media_data && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">File Format <span className="text-red-500">*</span></label>
                          <div className="flex flex-wrap gap-3">
                            {(["image", "pdf", "docs"] as const).map((fmt) => (
                              <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={!!field.media_data?.[fmt]}
                                  onChange={(e) => {
                                    const md = { ...field.media_data!, [fmt]: e.target.checked ? 1 : 0 };
                                    // Ensure at least one is checked
                                    if (!md.image && !md.pdf && !md.docs) {
                                      setMessage({ type: "error", text: "At least one file format is required" });
                                      return;
                                    }
                                    updateField(idx, { media_data: md });
                                  }}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                                <span className="text-xs font-medium text-gray-600 capitalize">{fmt === "image" ? "JPG/PNG" : fmt === "pdf" ? "PDF" : "DOC"}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            Upload Limit
                            <label className="flex items-center gap-1 ml-auto cursor-pointer">
                              <input type="checkbox"
                                checked={!!field.media_data?.upload_multiple_files}
                                onChange={(e) => updateField(idx, { media_data: { ...field.media_data!, upload_multiple_files: e.target.checked ? 1 : 0, file_upload_quantity: null } })}
                                className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded" />
                              <span className="text-xs">Unlimited</span>
                            </label>
                          </label>
                          {!field.media_data?.upload_multiple_files && (
                            <input type="number" min={1} value={field.media_data?.file_upload_quantity || ""}
                              onChange={(e) => updateField(idx, { media_data: { ...field.media_data!, file_upload_quantity: parseInt(e.target.value) || 1 } })}
                              placeholder="Max files" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checkbox options */}
                  {field.field_type === "check_box" && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Checkbox Options</label>
                      <div className="space-y-2">
                        {(field.check_data || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center shrink-0">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <input type="text" value={opt}
                              onChange={(e) => updateCheckBoxOption(idx, optIdx, e.target.value)}
                              placeholder="Enter option name" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                            {optIdx === 0 ? (
                              <button onClick={() => addCheckBoxOption(idx)}
                                className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-all">+ Add</button>
                            ) : (
                              <button onClick={() => removeCheckBoxOption(idx, optIdx)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ============ FORM PREVIEW ============ */}
          {showPreview && (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Form Preview
                  </h3>
                  <p className="text-xs text-indigo-600 mt-0.5">This is how the Join Us form will appear to {tab}s</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">PREVIEW</span>
              </div>
              <div className="p-8 max-w-2xl mx-auto">
                {/* Preview Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {tab === "owner" ? "Register Your Hostel" : "Create Customer Account"}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Fill in the details below to {tab === "owner" ? "list your hostel" : "create your account"}</p>
                </div>

                {/* Default Fields (shown as disabled/read-only) */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Standard Fields</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {defaultFields.map((f, i) => {
                      const ph = f.includes("Email") ? "owner@example.com" : f.includes("Phone") ? "+91 9876543210" : f.includes("Password") ? "••••••" : f.includes("Price") ? "₹ 5,000" : f.includes("Total Rooms") ? "e.g. 20" : f.includes("Zip") ? "e.g. 500001" : `Enter ${f.toLowerCase()}`;
                      return (
                        <div key={i}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{f} <span className="text-red-500">*</span></label>
                          <div className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 italic">
                            {ph}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Fields Preview */}
                {fields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Additional Fields</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {fields.map((field, idx) => (
                        <div key={idx} className={field.field_type === "textarea" || field.field_type === "file" ? "sm:col-span-2" : ""}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {prettyName(field.input_data)} {field.is_required && <span className="text-red-500">*</span>}
                          </label>
                          {field.field_type === "textarea" ? (
                            <textarea placeholder={field.placeholder_data} rows={3} disabled
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 resize-none" />
                          ) : field.field_type === "file" ? (
                            <div className="w-full px-4 py-6 bg-white border-2 border-dashed border-gray-200 rounded-xl text-center">
                              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                              <p className="text-xs text-gray-400">Click or drag file to upload</p>
                              <p className="text-[10px] text-gray-300 mt-1">
                                {[field.media_data?.image ? "JPG/PNG" : "", field.media_data?.pdf ? "PDF" : "", field.media_data?.docs ? "DOC" : ""].filter(Boolean).join(", ")}
                                {field.media_data?.upload_multiple_files ? " • Multiple files" : field.media_data?.file_upload_quantity ? ` • Max ${field.media_data.file_upload_quantity}` : ""}
                              </p>
                            </div>
                          ) : field.field_type === "check_box" ? (
                            <div className="space-y-2 mt-1">
                              {(field.check_data || []).map((opt, oi) => (
                                <label key={oi} className="flex items-center gap-2 cursor-pointer">
                                  <div className="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-indigo-600 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <span className="text-sm text-gray-700">{opt || "Option"}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input type={field.field_type === "phone" ? "tel" : field.field_type}
                              placeholder={field.placeholder_data} disabled
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Submit */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <div className="inline-flex px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/20 opacity-75 cursor-not-allowed">
                    Submit Application
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">This is a preview — form is not functional here</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {dirty && <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>Unsaved changes</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={fetchFields}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">
                Reset
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${dirty ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                {saving ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
