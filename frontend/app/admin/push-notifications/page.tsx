"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface PushCampaign {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  zone: string;
  target: string;
  status: number;
  created_at: string;
}

const ic = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

export default function PushNotificationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Campaign list
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("customer");
  const [zone, setZone] = useState("all");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "list">("create");

  useEffect(() => { setUser(getCurrentUser()); fetchCampaigns(); }, []);

  const fetchCampaigns = async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/push-campaigns?${params}`);
      if (res.success && res.data) {
        setCampaigns(res.data.notifications || []);
        setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage({ type: "error", text: "Image must be under 2MB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImage(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTarget("customer");
    setZone("all");
    setImage("");
    setImagePreview("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { setMessage({ type: "error", text: "Title is required" }); return; }
    if (!description) { setMessage({ type: "error", text: "Description is required" }); return; }

    setSaving(true);
    setMessage(null);
    try {
      if (editingId) {
        const res = await apiFetch(`/api/push-campaigns/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ title, description, image, zone, target }),
        });
        if (res.success) {
          setMessage({ type: "success", text: "✅ Notification updated and resent!" });
          resetForm();
          setActiveTab("list");
          fetchCampaigns();
        } else {
          setMessage({ type: "error", text: res.message || "Failed" });
        }
      } else {
        const res = await apiFetch("/api/push-campaigns", {
          method: "POST",
          body: JSON.stringify({ title, description, image, zone, target }),
        });
        if (res.success) {
          setMessage({ type: "success", text: "✅ Notification sent successfully!" });
          resetForm();
          setActiveTab("list");
          fetchCampaigns();
        } else {
          setMessage({ type: "error", text: res.message || "Failed" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (campaign: PushCampaign) => {
    setEditingId(campaign.id);
    setTitle(campaign.title);
    setDescription(campaign.description || "");
    setTarget(campaign.target);
    setZone(campaign.zone || "all");
    setImage(campaign.image || "");
    setImagePreview(campaign.image || "");
    setActiveTab("create");
    setMessage(null);
  };

  const toggleStatus = async (id: number, current: number) => {
    try {
      await apiFetch(`/api/push-campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: current ? 0 : 1 }),
      });
      fetchCampaigns(pagination.page);
    } catch {}
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      const res = await apiFetch(`/api/push-campaigns/${id}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Notification deleted!" });
        fetchCampaigns(pagination.page);
      }
    } catch {}
  };

  const targetLabel = (t: string) => {
    const map: Record<string, string> = { customer: "Customer", owner: "Owner", all: "All Users" };
    return map[t] || t;
  };

  const targetBadgeColor = (t: string) => {
    const map: Record<string, string> = { customer: "bg-blue-50 text-blue-700 border-blue-200", owner: "bg-emerald-50 text-emerald-700 border-emerald-200", all: "bg-purple-50 text-purple-700 border-purple-200" };
    return map[t] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notification</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send push notifications to customers and owners</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab("create"); if (editingId) resetForm(); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "create" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
        >
          {editingId ? "Edit Notification" : "Send Notification"}
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "list" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
        >
          Notification List
        </button>
      </div>

      {/* ===== CREATE / EDIT TAB ===== */}
      {activeTab === "create" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{editingId ? "Update Notification" : "Send New Notification"}</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: form fields */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Special Offer!" className={ic} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Send To <span className="text-red-500">*</span></label>
                    <select value={target} onChange={e => setTarget(e.target.value)} className={ic + " bg-white"}>
                      <option value="customer">Customer</option>
                      <option value="owner">Owner</option>
                      <option value="all">All Users</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Get 50% off on your first booking!" rows={4} className={ic + " resize-none"} required />
                </div>
              </div>

              {/* Right: image upload */}
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="text-sm font-bold text-gray-700 mb-1">Notification Image</h5>
                <p className="text-[11px] text-gray-400 mb-4">Upload image (optional)</p>
                <div
                  className="w-full aspect-[3/1] bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-400 transition-all overflow-hidden relative group"
                  onClick={() => fileRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImage(""); setImagePreview(""); }} className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-xs text-amber-600 font-semibold">Click to upload</p>
                      <p className="text-[10px] text-gray-400 mt-1">Or drag and drop</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">JPG, JPEG, PNG, GIF (Max 2MB) — Ratio 3:1</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => { resetForm(); if (editingId) setActiveTab("list"); }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Reset</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20">
                {saving ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>{editingId ? "Update & Resend" : "Send Notification"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== LIST TAB ===== */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h5 className="font-bold text-gray-900">
              Notification List
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{pagination.total}</span>
            </h5>
            <div className="relative">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchCampaigns(1)} placeholder="Search by title..." className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              <button onClick={() => fetchCampaigns(1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <h5 className="text-gray-400 font-medium">No notifications sent yet</h5>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-5 py-3 text-center font-semibold w-12">#</th>
                      <th className="px-5 py-3 text-left font-semibold w-48">Title</th>
                      <th className="px-5 py-3 text-left font-semibold">Description</th>
                      <th className="px-5 py-3 text-center font-semibold w-24">Image</th>
                      <th className="px-5 py-3 text-center font-semibold w-28">Target</th>
                      <th className="px-5 py-3 text-center font-semibold w-24">Status</th>
                      <th className="px-5 py-3 text-center font-semibold w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaigns.map((campaign, idx) => (
                      <tr key={campaign.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-center text-gray-500">{(pagination.page - 1) * 25 + idx + 1}</td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-gray-900 truncate block max-w-[180px]">{campaign.title}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs truncate max-w-[200px]">{campaign.description || "—"}</td>
                        <td className="px-5 py-3 text-center">
                          {campaign.image ? (
                            <img src={campaign.image} alt="" className="w-10 h-8 object-cover rounded-lg mx-auto border border-gray-100" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${targetBadgeColor(campaign.target)}`}>
                            {targetLabel(campaign.target)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!campaign.status} onChange={() => toggleStatus(campaign.id, campaign.status)} className="sr-only peer" />
                            <div className={`w-10 h-5 rounded-full transition-colors ${campaign.status ? "bg-green-500" : "bg-gray-300"}`} />
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${campaign.status ? "translate-x-5" : ""}`} />
                          </label>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEdit(campaign)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Edit & Resend">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => deleteCampaign(campaign.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Showing {(pagination.page - 1) * 25 + 1}–{Math.min(pagination.page * 25, pagination.total)} of {pagination.total}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => fetchCampaigns(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Prev</button>
                    <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                    <button onClick={() => fetchCampaigns(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
