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
  const [previewStep, setPreviewStep] = useState(1);
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

          {/* ============ FORM PREVIEW — matches /owner/register-hostel exactly ============ */}
          {showPreview && tab === "owner" && (
            <div className="rounded-3xl overflow-hidden border-2 border-indigo-200 shadow-2xl">
              {/* Preview Banner */}
              <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
                <span className="text-white text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Live Preview — Owner Registration Form
                </span>
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">PREVIEW</span>
              </div>

              {/* Dark background matching the actual form */}
              <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
                {/* Header */}
                <div className="bg-white/5 border-b border-white/10">
                  <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-white">Hostel Management</h1>
                        <p className="text-xs text-emerald-300/60">Hostel Registration</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">Sign Out</span>
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
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${s.num === previewStep ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : s.num < previewStep ? "bg-emerald-600/30 text-emerald-300" : "bg-white/5 text-gray-500"}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.num < previewStep ? "bg-emerald-500 text-white" : s.num === previewStep ? "bg-white text-emerald-700" : "bg-white/10 text-gray-500"}`}>
                              {s.num < previewStep ? "✓" : s.num}
                            </span>
                            <span className="hidden sm:inline">{s.label}</span>
                          </div>
                          {s.num < 3 && <div className={`w-8 h-0.5 ${s.num < previewStep ? "bg-emerald-500" : "bg-white/10"}`} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ═══ Step 1: Hostel Info ═══ */}
                  {previewStep === 1 && (
                    <div className="space-y-5">
                      <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Hostel Name <span className="text-red-400">*</span></label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Ex: ABC Hostel</div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Hostel Address <span className="text-red-400">*</span></label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Ex: House#94, Road#8, Abc City</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Zone <span className="text-red-400">*</span></label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Select Zone</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone <span className="text-red-400">*</span></label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">+(880)00-000-00000</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">hostel@example.com</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Short description about hostel</div>
                          </div>
                        </div>

                        {/* Map placeholder */}
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Location on Map</label>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3 flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-blue-300">Set precise location on map for your exact pickup location</p>
                          </div>
                          <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm mb-3">Search location here...</div>
                          <div className="w-full h-[200px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400">Lat:</label>
                              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-500 w-28">0.000000</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400">Lng:</label>
                              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-500 w-28">0.000000</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Logo & Cover */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                          <h3 className="text-sm font-bold text-white mb-4">Hostel Logo <span className="text-red-400">*</span> <span className="text-xs font-normal text-gray-400">(1:1 ratio)</span></h3>
                          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                            <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-sm text-gray-400">Click to upload logo</p>
                            <p className="text-xs text-gray-500 mt-1">Max 2MB</p>
                          </div>
                        </div>
                        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                          <h3 className="text-sm font-bold text-white mb-4">Cover Photo <span className="text-red-400">*</span> <span className="text-xs font-normal text-gray-400">(3:1 ratio)</span></h3>
                          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                            <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-sm text-gray-400">Click to upload cover</p>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button onClick={() => setPreviewStep(2)} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2">
                          Next: Details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ═══ Step 2: Details + Amenities + Custom Fields ═══ */}
                  {previewStep === 2 && (
                    <div className="space-y-5">
                      <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          General Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {["Total Rooms *", "Total Beds *", "Minimum Stay (days)", "Check-in Time", "Check-out Time"].map((f) => (
                            <div key={f}>
                              <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.replace(" *", "")}{f.includes("*") && <span className="text-red-400"> *</span>}</label>
                              <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">{f.includes("Time") ? "--:--" : "0"}</div>
                            </div>
                          ))}
                        </div>

                        {/* Amenities */}
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Amenities</label>
                          <div className="flex flex-wrap gap-2">
                            {["WiFi", "Parking", "Laundry", "AC", "Kitchen", "Gym", "Pool", "Security", "Elevator", "CCTV"].map((a) => (
                              <span key={a} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-gray-400 border border-white/10">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Custom Fields from Join Us Page Setup */}
                      {fields.length > 0 && (
                        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Additional Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((field, idx) => (
                              <div key={idx} className={field.field_type === "textarea" || field.field_type === "file" ? "md:col-span-2" : ""}>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  {prettyName(field.input_data)} {field.is_required && <span className="text-red-400">*</span>}
                                </label>
                                {field.field_type === "textarea" ? (
                                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">{field.placeholder_data || `Enter ${prettyName(field.input_data).toLowerCase()}`}</div>
                                ) : field.field_type === "file" ? (
                                  <div className="w-full px-4 py-6 bg-white/5 border-2 border-dashed border-white/20 rounded-xl text-center">
                                    <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <p className="text-xs text-gray-400">Click or drag file to upload</p>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                      {[field.media_data?.image ? "JPG/PNG" : "", field.media_data?.pdf ? "PDF" : "", field.media_data?.docs ? "DOC" : ""].filter(Boolean).join(", ")}
                                    </p>
                                  </div>
                                ) : field.field_type === "check_box" ? (
                                  <div className="space-y-2 mt-1">
                                    {(field.check_data || []).map((opt, oi) => (
                                      <label key={oi} className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-gray-500 rounded flex items-center justify-center">
                                          <svg className="w-2.5 h-2.5 text-emerald-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-sm text-gray-300">{opt || "Option"}</span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">{field.placeholder_data || `Enter ${prettyName(field.input_data).toLowerCase()}`}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <button onClick={() => setPreviewStep(1)} className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
                        </button>
                        <button onClick={() => setPreviewStep(3)} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2">
                          Next: Owner Info <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ═══ Step 3: Owner Info ═══ */}
                  {previewStep === 3 && (
                    <div className="space-y-5">
                      <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Owner Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {["First Name *", "Last Name *", "Phone *", "Email *"].map((f) => (
                            <div key={f}>
                              <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.replace(" *", "")}{f.includes("*") && <span className="text-red-400"> *</span>}</label>
                              <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">
                                {f.includes("First") ? "John" : f.includes("Last") ? "Doe" : f.includes("Phone") ? "+(880)00-000-00000" : "owner@example.com"}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                              <p className="text-yellow-300 text-sm font-medium">What happens next?</p>
                              <p className="text-yellow-300/70 text-xs mt-1 leading-relaxed">After submitting your application, our admin team will review your hostel details. Once approved, you&apos;ll be able to access the owner dashboard.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button onClick={() => setPreviewStep(2)} className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back
                        </button>
                        <div className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 opacity-75">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Submit Application
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Preview — matches /register/customer exactly */}
          {showPreview && tab === "customer" && (
            <div className="rounded-3xl overflow-hidden border-2 border-indigo-200 shadow-2xl">
              {/* Preview Banner */}
              <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
                <span className="text-white text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Live Preview — Customer Registration Form
                </span>
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">PREVIEW</span>
              </div>

              {/* Dark background matching the actual form */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-8">
                <div className="w-full max-w-[420px]">
                  {/* Back link */}
                  <div className="inline-flex items-center text-blue-300 text-sm mb-5">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Login
                  </div>

                  {/* Card */}
                  <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-7 shadow-2xl shadow-blue-900/20 border border-white/10">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 shadow-lg shadow-blue-600/30">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                      </div>
                      <h1 className="text-xl font-bold text-white">Create Account</h1>
                      <p className="text-blue-300/60 text-xs mt-1">Join Hostel Management and book your perfect hostel room</p>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-3.5">
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </div>
                          <div className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Email Address *</div>
                        </div>
                      </div>

                      {/* Password Section */}
                      <div className="bg-white/[0.03] rounded-xl p-3.5 space-y-3 border border-white/5">
                        <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">🔒 Set Password</p>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </div>
                          <div className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Password (min 6 chars) *</div>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          </div>
                          <div className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">Confirm Password *</div>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </div>
                        </div>
                      </div>

                      {/* Custom Fields from Join Us Page Setup */}
                      {fields.length > 0 && fields.map((field, idx) => (
                        <div key={idx} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                          <label className="block text-xs font-medium text-gray-300 mb-1.5">
                            {prettyName(field.input_data)} {field.is_required && <span className="text-red-400">*</span>}
                          </label>
                          {field.field_type === "textarea" ? (
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">{field.placeholder_data || `Enter ${prettyName(field.input_data).toLowerCase()}`}</div>
                          ) : field.field_type === "file" ? (
                            <div className="w-full px-4 py-5 bg-white/5 border-2 border-dashed border-white/20 rounded-xl text-center">
                              <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                              <p className="text-xs text-gray-400">Click or drag file to upload</p>
                            </div>
                          ) : field.field_type === "check_box" ? (
                            <div className="space-y-2 mt-1">
                              {(field.check_data || []).map((opt, oi) => (
                                <label key={oi} className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-gray-500 rounded flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-blue-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <span className="text-sm text-gray-300">{opt || "Option"}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">{field.placeholder_data || `Enter ${prettyName(field.input_data).toLowerCase()}`}</div>
                          )}
                        </div>
                      ))}

                      {/* Create Account Button */}
                      <div className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25 text-sm text-center opacity-75">
                        Create Account
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                      <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">or sign up with</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    </div>

                    {/* Social Buttons */}
                    <div className="space-y-3">
                      <div className="w-full py-3 px-4 bg-white/[0.06] border border-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-3 text-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                      </div>
                      <div className="w-full py-3 px-4 bg-white/[0.06] border border-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-3 text-sm">
                        <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        Sign up with Apple
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <p className="text-center text-gray-400 text-sm mt-5">
                    Already have an account?{" "}
                    <span className="text-blue-400 font-semibold">Sign In</span>
                  </p>
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
