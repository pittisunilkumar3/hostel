"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface Banner {
  id: number;
  title: string;
  type: string;
  image: string | null;
  data: string | null;
  zone_id: number | null;
  zone_name: string | null;
  status: number;
  created_at: string;
}

interface Zone { id: number; name: string; }
interface Room { id: number; name: string; room_number: string; }

export default function BannersPage() {
  const [user, setUser] = useState<any>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Form state
  const [title, setTitle] = useState("");
  const [bannerType, setBannerType] = useState("room_wise");
  const [zoneId, setZoneId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUser(getCurrentUser()); fetchBanners(); fetchZones(); }, []);

  const fetchBanners = async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await apiFetch(`/api/banners?${params}`);
      if (res.success && res.data) {
        setBanners(res.data.banners);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchZones = async () => {
    try {
      const res = await apiFetch("/api/zones");
      if (res.success) setZones(res.data || []);
    } catch {}
  };

  const fetchRooms = async (zid: string) => {
    if (!zid) { setRooms([]); return; }
    try {
      const res = await apiFetch(`/api/rooms?zone_id=${zid}&limit=100`);
      if (res.success) setRooms(res.data?.rooms || res.data || []);
    } catch {}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { setMessage({ type: "error", text: "Title is required" }); return; }
    if (!image) { setMessage({ type: "error", text: "Image is required" }); return; }
    if (!zoneId) { setMessage({ type: "error", text: "Zone is required" }); return; }
    if (bannerType === "room_wise" && !roomId) { setMessage({ type: "error", text: "Room is required for room-wise banner" }); return; }

    setSaving(true); setMessage(null);
    try {
      const res = await apiFetch("/api/banners", {
        method: "POST",
        body: JSON.stringify({
          title,
          type: bannerType,
          image,
          data: bannerType === "room_wise" ? roomId : zoneId,
          zone_id: zoneId,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Banner created successfully!" });
        setTitle(""); setBannerType("room_wise"); setZoneId(""); setRoomId(""); setImage(""); setImagePreview("");
        fetchBanners();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); } finally { setSaving(false); }
  };

  const toggleStatus = async (id: number, current: number) => {
    try {
      await apiFetch(`/api/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title: banners.find(b => b.id === id)?.title, status: current ? 0 : 1 }),
      });
      fetchBanners(pagination.page);
    } catch {}
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await apiFetch(`/api/banners/${id}`, { method: "DELETE" });
      if (res.success) { setMessage({ type: "success", text: "✅ Banner deleted!" }); fetchBanners(pagination.page); }
    } catch {}
  };

  const typeLabel = (t: string) => t === "room_wise" ? "Room Wise" : "Zone Wise";

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
        <p className="text-gray-500 mt-1">Add new banner and manage existing banners</p>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {/* Add Banner Form */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Add New Banner</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: form fields */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="New Banner" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone <span className="text-red-500">*</span></label>
                  <select value={zoneId} onChange={e => { setZoneId(e.target.value); fetchRooms(e.target.value); setRoomId(""); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/30">
                    <option value="">--- Select Zone ---</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type <span className="text-red-500">*</span></label>
                  <select value={bannerType} onChange={e => setBannerType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/30">
                    <option value="room_wise">Room Wise</option>
                    <option value="zone_wise">Zone Wise</option>
                  </select>
                </div>
              </div>
              {bannerType === "room_wise" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Room <span className="text-red-500">*</span></label>
                  <select value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/30" disabled={!zoneId}>
                    <option value="">--- Select Room ---</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.room_number})</option>)}
                  </select>
                  {!zoneId && <p className="text-[11px] text-gray-400 mt-1">Select a zone first to load rooms</p>}
                </div>
              )}
            </div>

            {/* Right: image upload */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h5 className="text-sm font-bold text-gray-700 mb-1">Banner Image <span className="text-red-500">*</span></h5>
              <p className="text-[11px] text-gray-400 mb-4">Upload your image here</p>
              <div
                className="w-full aspect-[2/1] bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group"
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImage(""); setImagePreview(""); }} className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-xs text-blue-600 font-semibold">Click to upload</p>
                    <p className="text-[10px] text-gray-400 mt-1">Or drag and drop</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-3">JPG, JPEG, PNG, GIF (Max 2MB) — Ratio 2:1</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button type="reset" onClick={() => { setTitle(""); setImage(""); setImagePreview(""); setZoneId(""); setRoomId(""); }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">Reset</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
              {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Banner List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h5 className="font-bold text-gray-900">Banner List <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{pagination.total}</span></h5>
          <div className="flex items-center gap-3">
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setTimeout(() => fetchBanners(1), 100); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white min-w-[150px]">
              <option value="">All Banners</option>
              <option value="room_wise">Room Wise</option>
              <option value="zone_wise">Zone Wise</option>
            </select>
            <div className="relative">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchBanners(1)} placeholder="Search by title..." className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              <button onClick={() => fetchBanners(1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <h5 className="text-gray-400 font-medium">No banners found</h5>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-gray-600">
                  <th className="px-5 py-3 text-center font-semibold w-12">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Banner Info</th>
                  <th className="px-5 py-3 text-left font-semibold">Zone</th>
                  <th className="px-5 py-3 text-left font-semibold">Banner Type</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-center font-semibold">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {banners.map((banner, idx) => (
                    <tr key={banner.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-center text-gray-500">{(pagination.page - 1) * 25 + idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {banner.image ? (
                            <img src={banner.image} alt={banner.title} className="w-16 h-8 object-cover rounded-lg border border-gray-100" />
                          ) : (
                            <div className="w-16 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                          )}
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{banner.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{banner.zone_name || "—"}</td>
                      <td className="px-5 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">{typeLabel(banner.type)}</span></td>
                      <td className="px-5 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!banner.status} onChange={() => toggleStatus(banner.id, banner.status)} className="sr-only peer" />
                          <div className={`w-10 h-5 rounded-full transition-colors ${banner.status ? "bg-green-500" : "bg-gray-300"}`} />
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${banner.status ? "translate-x-5" : ""}`} />
                        </label>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <a href={`/admin/banners/${banner.id}`} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </a>
                          <button onClick={() => deleteBanner(banner.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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
                  <button onClick={() => fetchBanners(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Prev</button>
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => fetchBanners(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
