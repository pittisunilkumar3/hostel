"use client";

import { useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

const emptyForm = { title: "", description: "", add_type: "restaurant_promotion", owner_name: "", profile_image: "", cover_image: "", video_attachment: "", start_date: "", end_date: "" };

export default function NewAdvertisementPage() {
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [profilePreview, setProfilePreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const profileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageUpload = (field: "profile_image" | "cover_image", setPreview: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage({ type: "error", text: "Image must be under 2MB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm(f => ({ ...f, [field]: result }));
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { setMessage({ type: "error", text: "Title is required" }); return; }
    setSaving(true); setMessage(null);
    try {
      const res = await apiFetch("/api/advertisements", { method: "POST", body: JSON.stringify(form) });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Advertisement created successfully!" });
        setTimeout(() => router.push("/admin/advertisements"), 1500);
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); } finally { setSaving(false); }
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Advertisement</h1>
        <p className="text-gray-500 mt-1">Create a new advertisement campaign</p>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - form fields */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Summer Hostel Promo" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
                  <select value={form.add_type} onChange={e => setForm(f => ({ ...f, add_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/30">
                    <option value="restaurant_promotion">Hostel Promotion</option>
                    <option value="video_promotion">Video Promotion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the advertisement..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner / Business Name</label>
                  <input type="text" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="e.g., Sunset Hostel" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                </div>
              </div>

              {form.add_type === "video_promotion" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                  <input type="url" value={form.video_attachment} onChange={e => setForm(f => ({ ...f, video_attachment: e.target.value }))} placeholder="https://example.com/video.mp4" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
              )}
            </div>

            {/* Right side - image uploads */}
            <div className="space-y-4">
              {form.add_type !== "video_promotion" ? (
                <>
                  {/* Profile Image */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Profile Image</label>
                    <p className="text-[11px] text-gray-400 mb-2">Square image, shown in ad cards</p>
                    <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group" onClick={() => profileRef.current?.click()}>
                      {profilePreview ? (
                        <>
                          <img src={profilePreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, profile_image: "" })); setProfilePreview(""); }} className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="text-xs text-blue-600 font-semibold">Click to upload</p>
                          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG (Max 2MB)</p>
                        </div>
                      )}
                      <input ref={profileRef} type="file" accept="image/*" onChange={handleImageUpload("profile_image", setProfilePreview)} className="hidden" />
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                    <p className="text-[11px] text-gray-400 mb-2">Banner image, 2:1 ratio recommended</p>
                    <div className="w-full aspect-[2/1] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group" onClick={() => coverRef.current?.click()}>
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, cover_image: "" })); setCoverPreview(""); }} className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="text-xs text-blue-600 font-semibold">Click to upload</p>
                          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG (Max 2MB)</p>
                        </div>
                      )}
                      <input ref={coverRef} type="file" accept="image/*" onChange={handleImageUpload("cover_image", setCoverPreview)} className="hidden" />
                    </div>
                  </div>
                </>
              ) : (
                /* Video Promotion - show large video URL area */
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-100 min-h-[300px]">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <p className="text-sm font-bold text-gray-600">Video Promotion</p>
                  <p className="text-xs text-gray-400 mt-1 text-center">Enter the video URL in the form field on the left</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => router.push("/admin/advertisements")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
              {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              Create Advertisement
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
