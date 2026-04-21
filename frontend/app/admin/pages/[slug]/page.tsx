"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useParams } from "next/navigation";

// Dynamic import for Quill editor (CKEditor equivalent)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["link", "image", "video"],
    ["clean"],
    ["code-block"],
    [{ script: "sub" }, { script: "super" }],
  ],
};

const QUILL_FORMATS = [
  "header", "font", "bold", "italic", "underline", "strike", "blockquote",
  "color", "background", "list", "bullet", "indent", "align",
  "link", "image", "video", "code-block", "script",
];

interface CmsPage {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  is_active: number;
}

// Page metadata matching reference project
const PAGE_META: Record<string, { title: string; icon: string; description: string; hasStatusToggle: boolean }> = {
  "terms-and-conditions": { title: "Terms and Conditions", icon: "📋", description: "Manage your Terms and Conditions", hasStatusToggle: false },
  "privacy-policy": { title: "Privacy Policy", icon: "🔒", description: "Manage your Privacy Policy", hasStatusToggle: false },
  "about-us": { title: "About Us", icon: "ℹ️", description: "Manage your About Us page", hasStatusToggle: false },
  "refund-policy": { title: "Refund Policy", icon: "💰", description: "Manage your Refund Policy", hasStatusToggle: true },
  "cancellation-policy": { title: "Cancellation Policy", icon: "❌", description: "Manage your Cancellation Policy", hasStatusToggle: true },
};

export default function CmsPageEditor() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState<CmsPage | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const meta = PAGE_META[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    icon: "📄",
    description: `Manage your ${slug.replace(/-/g, " ")} page`,
    hasStatusToggle: false,
  };

  useEffect(() => {
    fetchPage();
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => setEditorReady(true), 100);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/cms/pages/slug/${slug}`);
      if (res.success && res.data) {
        setPage(res.data);
        setContent(res.data.content || "");
        setTitle(res.data.title || "");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch(`/api/cms/pages/${page.id}`, {
        method: "PUT",
        body: JSON.stringify({ content, title }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${meta.title} updated successfully!` });
        fetchPage();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!page) return;
    try {
      const res = await apiFetch(`/api/cms/pages/${page.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !page.is_active }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${meta.title} ${!page.is_active ? "enabled" : "disabled"}!` });
        fetchPage();
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={getSidebarItems()} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="page-header mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{meta.title}</h1>
        </div>
        {/* Status Toggle for refund/cancellation like reference */}
        {meta.hasStatusToggle && (
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${page?.is_active ? "text-blue-600" : "text-gray-400"}`}>
              {page?.is_active ? "ON" : "OFF"}
            </span>
            <span className="text-sm text-gray-400">Status</span>
            <button
              onClick={handleStatusToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${page?.is_active ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${page?.is_active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Editor Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Language Tab - matches reference */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <ul className="flex items-center gap-1">
            <li>
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-1.5 shadow-sm">
                <span className="text-base">🇬🇧</span>
                Default
              </span>
            </li>
            <li>
              <span className="px-4 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-gray-100 cursor-not-allowed flex items-center gap-1.5">
                <span className="text-base">🇬🇧</span>
                English (EN)
              </span>
            </li>
          </ul>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading editor...
          </div>
        ) : (
          <div className="p-0">
            {/* CKEditor-style Rich Text Editor (using Quill as equivalent) */}
            <div className="[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50/80 [&_.ql-toolbar]:px-6 [&_.ql-toolbar]:py-3 [&_.ql-container]:border-0 [&_.ql-container]:h-[500px] [&_.ql-container]:px-6 [&_.ql-container]:py-4 [&_.ql-container]:text-base [&_.ql-editor]:text-gray-800 [&_.ql-editor]:min-h-[500px] [&_.ql-snow_.ql-picker]:text-gray-600">
              {editorReady && (
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  placeholder={`Start writing your ${meta.title} content here...`}
                />
              )}
            </div>
          </div>
        )}

        {/* Submit button - matches reference */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {saving ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
