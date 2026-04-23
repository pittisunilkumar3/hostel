"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import Link from "next/link";

const sidebarItems = getSidebarItems();

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  add_type: string;
  owner_id: number | null;
  owner_name: string | null;
  priority: number | null;
  profile_image: string | null;
  cover_image: string | null;
  video_attachment: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_paid: number;
  active: number;
  created_at: string;
}

export default function AdvertisementsListPage() {
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [adsType, setAdsType] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => { setUser(getCurrentUser()); fetchAds(); }, []);

  const fetchAds = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (adsType) params.set("ads_type", adsType);
      const res = await apiFetch(`/api/advertisements?${params}`);
      if (res.success && res.data) {
        setAds(res.data.advertisements);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const changeStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/advertisements/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      fetchAds(pagination.page);
    } catch {}
  };

  const togglePaid = async (id: number, current: number) => {
    try {
      await apiFetch(`/api/advertisements/${id}`, { method: "PUT", body: JSON.stringify({ is_paid: current ? 0 : 1 }) });
      fetchAds(pagination.page);
    } catch {}
  };

  const deleteAd = async (id: number) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      const res = await apiFetch(`/api/advertisements/${id}`, { method: "DELETE" });
      if (res.success) { setMessage({ type: "success", text: "✅ Advertisement deleted!" }); fetchAds(pagination.page); }
    } catch {}
  };

  const statusBadge = (a: Advertisement) => {
    if (a.status === "approved" && a.active === 1) return <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">Running</span>;
    if (a.status === "approved" && a.active === 2) return <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">Approved</span>;
    if (a.status === "paused") return <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full">Paused</span>;
    if (a.status === "denied" || a.status === "expired" || a.active === 0) return <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full">{a.status === "denied" ? "Denied" : "Expired"}</span>;
    if (a.status === "pending") return <span className="px-2 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-full">Pending</span>;
    return <span className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-full capitalize">{a.status}</span>;
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads List</h1>
          <p className="text-gray-500 mt-1">All advertisements</p>
        </div>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {/* Ads List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h5 className="font-bold text-gray-900">Advertisement List <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{pagination.total}</span></h5>
          <div className="flex items-center gap-3">
            <select value={adsType} onChange={e => { setAdsType(e.target.value); setTimeout(() => fetchAds(1), 100); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white min-w-[150px]">
              <option value="">All Ads</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="approved">Approved</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="denied">Denied</option>
            </select>
            <div className="relative">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchAds(1)} placeholder="Search ads..." className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              <button onClick={() => fetchAds(1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            <h5 className="text-gray-400 font-medium">No advertisements found</h5>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-gray-600">
                  <th className="px-5 py-3 text-center font-semibold w-12">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Ad Info</th>
                  <th className="px-5 py-3 text-left font-semibold">Owner</th>
                  <th className="px-5 py-3 text-left font-semibold">Type</th>
                  <th className="px-5 py-3 text-left font-semibold">Duration</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-center font-semibold">Paid</th>
                  <th className="px-5 py-3 text-center font-semibold">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {ads.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-center text-gray-500">{(pagination.page - 1) * 25 + idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {a.profile_image ? <img src={a.profile_image} alt="" className="w-10 h-10 object-cover rounded-lg border" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                          <div>
                            <p className="font-medium text-gray-900">{a.title}</p>
                            <p className="text-[10px] text-gray-400">ID: #{a.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{a.owner_name || "—"}</td>
                      <td className="px-5 py-3"><span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full">{a.add_type === "video_promotion" ? "Video" : "Hostel"}</span></td>
                      <td className="px-5 py-3 text-xs text-gray-600">{a.start_date?.split("T")[0]} — {a.end_date?.split("T")[0]}</td>
                      <td className="px-5 py-3">{statusBadge(a)}</td>
                      <td className="px-5 py-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={!!a.is_paid} onChange={() => togglePaid(a.id, a.is_paid)} className="sr-only peer" />
                          <div className={`w-10 h-5 rounded-full transition-colors ${a.is_paid ? "bg-green-500" : "bg-gray-300"}`} />
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${a.is_paid ? "translate-x-5" : ""}`} />
                        </label>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <Link href={`/admin/advertisements/${a.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          {a.status === "paused" && (
                            <button onClick={() => changeStatus(a.id, "approved")} className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg" title="Resume">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                            </button>
                          )}
                          {a.status === "approved" && a.active === 1 && (
                            <button onClick={() => changeStatus(a.id, "paused")} className="p-1.5 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg" title="Pause">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          )}
                          <button onClick={() => deleteAd(a.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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
                  <button onClick={() => fetchAds(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Prev</button>
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => fetchAds(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
