"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface Campaign {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: number;
  created_at: string;
}

const emptyForm = { title: "", description: "", image: "", start_date: "", end_date: "", start_time: "", end_time: "" };

export default function CampaignsPage() {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUser(getCurrentUser()); fetchCampaigns(); }, []);

  const fetchCampaigns = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/campaigns?${params}`);
      if (res.success && res.data) {
        setCampaigns(res.data.campaigns);
        setPagination(res.data.pagination);
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
      setForm(f => ({ ...f, image: result }));
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { setMessage({ type: "error", text: "Title is required" }); return; }
    setSaving(true); setMessage(null);
    try {
      const url = editId ? `/api/campaigns/${editId}` : "/api/campaigns";
      const method = editId ? "PUT" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (res.success) {
        setMessage({ type: "success", text: `✅ Campaign ${editId ? "updated" : "created"} successfully!` });
        resetForm();
        fetchCampaigns(pagination.page);
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); } finally { setSaving(false); }
  };

  const toggleStatus = async (id: number, current: number) => {
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "PUT", body: JSON.stringify({ status: current ? 0 : 1 }) });
      fetchCampaigns(pagination.page);
    } catch {}
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.success) { setMessage({ type: "success", text: "✅ Campaign deleted!" }); fetchCampaigns(pagination.page); }
    } catch {}
  };

  const startEdit = (c: Campaign) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description || "", image: c.image || "", start_date: c.start_date ? c.start_date.split("T")[0] : "", end_date: c.end_date ? c.end_date.split("T")[0] : "", start_time: c.start_time || "", end_time: c.end_time || "" });
    setImagePreview(c.image || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm); setImagePreview(""); setEditId(null); setShowForm(false);
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage promotional campaigns</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Campaign
        </button>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">{editId ? "Edit Campaign" : "Add New Campaign"}</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Summer Special Offer" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Campaign description..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                </div>
              </div>
              {/* Image upload */}
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="text-sm font-bold text-gray-700 mb-1">Campaign Image</h5>
                <p className="text-[11px] text-gray-400 mb-4">Upload your image here</p>
                <div className="w-full aspect-square bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, image: "" })); setImagePreview(""); }} className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-xs text-blue-600 font-semibold">Click to upload</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">JPG, PNG (Max 2MB)</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
              <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
                {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                {editId ? "Update" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h5 className="font-bold text-gray-900">Campaign List <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{pagination.total}</span></h5>
          <div className="relative">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchCampaigns(1)} placeholder="Search campaigns..." className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <button onClick={() => fetchCampaigns(1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <h5 className="text-gray-400 font-medium">No campaigns found</h5>
            <p className="text-gray-300 text-sm mt-1">Create your first campaign to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-gray-600">
                  <th className="px-5 py-3 text-center font-semibold w-12">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Campaign</th>
                  <th className="px-5 py-3 text-left font-semibold">Duration</th>
                  <th className="px-5 py-3 text-left font-semibold">Time</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-center font-semibold">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-center text-gray-500">{(pagination.page - 1) * 25 + idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {c.image ? <img src={c.image} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                          <div>
                            <p className="font-medium text-gray-900">{c.title}</p>
                            {c.description && <p className="text-gray-400 text-xs truncate max-w-[200px]">{c.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{c.start_date && c.end_date ? `${c.start_date?.split("T")[0]} — ${c.end_date?.split("T")[0]}` : "—"}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{c.start_time && c.end_time ? `${c.start_time} — ${c.end_time}` : "—"}</td>
                      <td className="px-5 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!c.status} onChange={() => toggleStatus(c.id, c.status)} className="sr-only peer" />
                          <div className={`w-10 h-5 rounded-full transition-colors ${c.status ? "bg-green-500" : "bg-gray-300"}`} />
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${c.status ? "translate-x-5" : ""}`} />
                        </label>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(c)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deleteCampaign(c.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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
    </DashboardShell>
  );
}
