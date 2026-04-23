"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

const PAGE_LABELS: Record<string, string> = {
  home: "Home Page",
  about_us: "About Us",
  contact_us: "Contact Us",
  terms_and_conditions: "Terms and Conditions",
  privacy_policy: "Privacy Policy",
  refund_policy: "Refund Policy",
  cancellation_policy: "Cancellation Policy",
  login: "Login Page",
  register: "Register Page",
  rooms: "Rooms Page",
  bookings: "Bookings Page",
  faqs: "FAQs Page",
  blog: "Blog Page",
};

interface MetaData {
  meta_index: number;
  meta_no_follow: string;
  meta_no_image_index: string;
  meta_no_archive: string;
  meta_no_snippet: string;
  meta_max_snippet: string;
  meta_max_snippet_value: string;
  meta_max_video_preview: string;
  meta_max_video_preview_value: string;
  meta_max_image_preview: string;
  meta_max_image_preview_value: string;
}

export default function PageMetaDataEdit() {
  const { pageName } = useParams<{ pageName: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [meta, setMeta] = useState<MetaData>({
    meta_index: 1,
    meta_no_follow: "",
    meta_no_image_index: "",
    meta_no_archive: "",
    meta_no_snippet: "",
    meta_max_snippet: "",
    meta_max_snippet_value: "",
    meta_max_video_preview: "",
    meta_max_video_preview_value: "",
    meta_max_image_preview: "",
    meta_max_image_preview_value: "large",
  });

  useEffect(() => {
    setUser(getCurrentUser());
    fetchPageData();
  }, [pageName]);

  const fetchPageData = async () => {
    try {
      const res = await apiFetch(`/api/page-meta-data/${pageName}`);
      if (res.success && res.data) {
        setTitle(res.data.title || "");
        setDescription(res.data.description || "");
        setImage(res.data.image || "");
        if (res.data.image) setImagePreview(res.data.image);
        if (res.data.meta_data) setMeta(res.data.meta_data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateMeta = (key: keyof MetaData, value: any) => {
    setMeta(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImage(result);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/page-meta-data/update", {
        method: "POST",
        body: JSON.stringify({
          page_name: pageName,
          title,
          description,
          image,
          meta_data: meta,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Page meta data saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = PAGE_LABELS[pageName] || pageName?.replace(/_/g, " ");

  // When "Index" selected, uncheck all No-* options
  const handleIndexChange = (val: number) => {
    updateMeta("meta_index", val);
    if (val === 1) {
      updateMeta("meta_no_follow", "");
      updateMeta("meta_no_image_index", "");
      updateMeta("meta_no_archive", "");
      updateMeta("meta_no_snippet", "");
    } else {
      // No Index → auto-check all No-* options
      updateMeta("meta_no_follow", "nofollow");
      updateMeta("meta_no_image_index", "noimageindex");
      updateMeta("meta_no_archive", "noarchive");
      updateMeta("meta_no_snippet", "nosnippet");
    }
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{pageTitle} Setup</h1>
        <button
          onClick={() => router.push("/admin/page-meta-data")}
          className="text-sm text-cyan-600 font-semibold hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to List
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Meta Data Setup</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Optimize your website&apos;s performance, indexing status, and search visibility.
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Title + Description */}
              <div className="lg:col-span-2 space-y-4">
                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Meta Title <span className="text-red-500">*</span>
                    <span className="ml-1" title="This title appears in browser tabs, search results, and link previews. Use a short, clear, and keyword-focused title (recommended: 80-100 characters)">
                      <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="Ex: Type meta title"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{title.length}/100</p>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Meta Description <span className="text-red-500">*</span>
                    <span className="ml-1" title="A brief summary that appears under your page title in search results. Keep it compelling and relevant (recommended: 120-160 characters)">
                      <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                    placeholder="Type a short meta description"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all resize-y"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{description.length}/160</p>
                </div>
              </div>

              {/* Right: Meta Image */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-5 h-full flex flex-col items-center justify-center">
                  <div className="mb-4 text-left w-full">
                    <label className="text-sm font-medium text-gray-700">
                      Meta Image <span className="text-red-500">*</span>
                      <span className="ml-1" title="This image is used as a preview thumbnail when the page link is shared on social media or messaging platforms.">
                        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                    </label>
                    <p className="text-[11px] text-gray-400 mt-0.5">Upload your meta image</p>
                  </div>
                  <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative bg-white">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Meta preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-xs text-gray-400">
                          <span className="text-cyan-600 font-medium">Click to upload</span>
                          <br />or drag and drop
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 text-center">
                    JPG, JPEG, PNG Less Than 2MB <span className="font-medium text-gray-600">(1260 × 360 px)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Index controls */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                {/* Index / No Index */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="meta_index"
                      checked={meta.meta_index === 1}
                      onChange={() => handleIndexChange(1)}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Index</span>
                    <span title="Allow search engines to put this web page on their list or index and show it on search results.">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="meta_index"
                      checked={meta.meta_index === 0}
                      onChange={() => handleIndexChange(0)}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">No Index</span>
                    <span title="Disallow search engines to put this web page on their list or index and do not show it on search results.">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_no_follow === "nofollow"}
                      onChange={e => updateMeta("meta_no_follow", e.target.checked ? "nofollow" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">No Follow</span>
                    <span title="Instruct search engines not to follow links from this web page.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_no_image_index === "noimageindex"}
                      onChange={e => updateMeta("meta_no_image_index", e.target.checked ? "noimageindex" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">No Image Index</span>
                    <span title="Prevents images from being listed or indexed by search engines.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_no_archive === "noarchive"}
                      onChange={e => updateMeta("meta_no_archive", e.target.checked ? "noarchive" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">No Archive</span>
                    <span title="Instruct search engines not to display this webpage's cached or saved version.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_no_snippet === "nosnippet"}
                      onChange={e => updateMeta("meta_no_snippet", e.target.checked ? "nosnippet" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">No Snippet</span>
                    <span title="Instruct search engines not to show a summary or snippet of this webpage's content in search results.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                </div>
              </div>

              {/* Right: Max controls */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                {/* Max Snippet */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_max_snippet === "1"}
                      onChange={e => updateMeta("meta_max_snippet", e.target.checked ? "1" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Max Snippet</span>
                    <span title="Determine the maximum length of a snippet or preview text of the webpage.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={meta.meta_max_snippet_value}
                    onChange={e => updateMeta("meta_max_snippet_value", e.target.value)}
                    placeholder="-1"
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>

                {/* Max Video Preview */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_max_video_preview === "1"}
                      onChange={e => updateMeta("meta_max_video_preview", e.target.checked ? "1" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Max Video Preview</span>
                    <span title="Determine the maximum duration of a video preview that search engines will display.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={meta.meta_max_video_preview_value}
                    onChange={e => updateMeta("meta_max_video_preview_value", e.target.value)}
                    placeholder="-1"
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>

                {/* Max Image Preview */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.meta_max_image_preview === "1"}
                      onChange={e => updateMeta("meta_max_image_preview", e.target.checked ? "1" : "")}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Max Image Preview</span>
                    <span title="Determine the maximum size or dimensions of an image preview that search engines will display.">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </label>
                  <select
                    value={meta.meta_max_image_preview_value}
                    onChange={e => updateMeta("meta_max_image_preview_value", e.target.value)}
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="large">Large</option>
                    <option value="medium">Medium</option>
                    <option value="small">Small</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setTitle(""); setDescription(""); setImage(""); setImagePreview(""); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                Reset
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-8 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
