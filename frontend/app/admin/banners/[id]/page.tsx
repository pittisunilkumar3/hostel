"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface Zone { id: number; name: string; }
interface Room { id: number; name: string; room_number: string; }

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [bannerType, setBannerType] = useState("room_wise");
  const [zoneId, setZoneId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchZones();
    fetchBanner();
  }, [id]);

  const fetchBanner = async () => {
    try {
      const res = await apiFetch(`/api/banners/${id}`);
      if (res.success && res.data) {
        const b = res.data;
        setTitle(b.title);
        setBannerType(b.type);
        setZoneId(String(b.zone_id || ""));
        setRoomId(String(b.data || ""));
        setImage(b.image || "");
        setImagePreview(b.image || "");
        if (b.zone_id) fetchRooms(String(b.zone_id));
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
    if (!zoneId) { setMessage({ type: "error", text: "Zone is required" }); return; }
    if (bannerType === "room_wise" && !roomId) { setMessage({ type: "error", text: "Room is required" }); return; }

    setSaving(true); setMessage(null);
    try {
      const res = await apiFetch(`/api/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          type: bannerType,
          image: image || undefined,
          data: bannerType === "room_wise" ? roomId : zoneId,
          zone_id: zoneId,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Banner updated successfully!" });
        fetchBanner();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); } finally { setSaving(false); }
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push("/admin/banners")} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Update Banner</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Edit banner details</p>
        </div>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {loading ? (
        <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title <span className="text-red-500">*</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone <span className="text-red-500">*</span></label>
                    <select value={zoneId} onChange={e => { setZoneId(e.target.value); fetchRooms(e.target.value); setRoomId(""); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                      <option value="">--- Select Zone ---</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type <span className="text-red-500">*</span></label>
                    <select value={bannerType} onChange={e => setBannerType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                      <option value="room_wise">Room Wise</option>
                      <option value="zone_wise">Zone Wise</option>
                    </select>
                  </div>
                </div>
                {bannerType === "room_wise" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Room <span className="text-red-500">*</span></label>
                    <select value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                      <option value="">--- Select Room ---</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.room_number})</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="text-sm font-bold text-gray-700 mb-1">Banner Image</h5>
                <p className="text-[11px] text-gray-400 mb-4">Click to change image</p>
                <div className="w-full aspect-[2/1] bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" className="p-2 bg-white rounded-lg text-gray-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImage(""); setImagePreview(""); }} className="p-2 bg-white rounded-lg text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center"><svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-xs text-blue-600 font-semibold">Click to upload</p></div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <p className="text-[10px] text-gray-400 mt-3">JPG, PNG, GIF (Max 2MB) — Ratio 2:1</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={() => router.push("/admin/banners")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20">
              {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              Update Banner
            </button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
