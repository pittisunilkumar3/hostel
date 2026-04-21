"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useParams } from "next/navigation";

// Dynamic import for Quill to avoid SSR issues
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
    ["undo", "redo"],
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

const PAGE_META: Record<string, { title: string; icon: string; description: string }> = {
  "terms-and-conditions": { title: "Terms and Conditions", icon: "📋", description: "Manage your Terms and Conditions page content" },
  "privacy-policy": { title: "Privacy Policy", icon: "🔒", description: "Manage your Privacy Policy page content" },
  "refund-policy": { title: "Refund Policy", icon: "💰", description: "Manage your Refund Policy page content" },
  "cancellation-policy": { title: "Cancellation Policy", icon: "❌", description: "Manage your Cancellation Policy page content" },
};

export default function CmsPageEditor() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState<CmsPage | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const meta = PAGE_META[slug] || { title: slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: "📄", description: `Manage your ${slug.replace(/-/g, " ")} page content` };

  useEffect(() => {
    fetchPage();
  }, [slug]);

  useEffect(() => {
    // Small delay to ensure quill is mounted
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
        setMessage({ type: "success", text: `✅ ${meta.title} saved successfully!` });
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

  return (
    <DashboardShell role="admin" title="Super Admin" items={getSidebarItems()} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">
            {meta.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meta.title}</h1>
            <p className="text-gray-500 mt-0.5 text-sm">{meta.description}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {saving ? (
            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save</>
          )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Title bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Language</span>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <span className="text-base">🇬🇧</span>
                English (EN)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {page?.is_active ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Active</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">Inactive</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading editor...
          </div>
        ) : (
          <div className="p-0">
            {/* Rich Text Editor */}
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
      </div>

      {/* Info box */}
      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div>
          <p className="text-sm font-medium text-indigo-800">Content Storage</p>
          <p className="text-xs text-indigo-600 mt-1">
            The content is stored as HTML in the database and will be rendered on the frontend CMS pages. 
            The editor supports rich text formatting, links, images, and embedded videos.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
