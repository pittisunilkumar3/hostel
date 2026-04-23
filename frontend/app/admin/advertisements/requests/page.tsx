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
  profile_image: string | null;
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_paid: number;
  active: number;
  created_at: string;
}

export default function AdRequestsPage() {
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "update" | "denied">("new");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => { setUser(getCurrentUser()); }, []);

  // Fetch ads based on active tab
  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);

      // Filter based on tab
      if (activeTab === "new") params.set("ads_type", "pending");
      else if (activeTab === "denied") params.set("ads_type", "denied");
      // "update" tab shows paused ads that need review
      else if (activeTab === "update") params.set("ads_type", "paused");

      const res = await apiFetch(`/api/advertisements?${params}`);
      if (res.success && res.data) {
        setAds(res.data.advertisements);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const approveAd = async (id: number) => {
    if (!confirm("Are you sure you want to approve this advertisement? It will be shown to users.")) return;
    try {
      const res = await apiFetch(`/api/advertisements/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "approved", active: 1 }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Advertisement approved!" });
        fetchRequests(pagination.page);
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); }
  };

  const denyAd = async (id: number) => {
    if (!confirm("Are you sure you want to deny this advertisement request?")) return;
    try {
      const res = await apiFetch(`/api/advertisements/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "denied" }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Advertisement denied." });
        fetchRequests(pagination.page);
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); }
  };

  const deleteAd = async (id: number) => {
    if (!confirm("Are you sure you want to delete this advertisement permanently?")) return;
    try {
      const res = await apiFetch(`/api/advertisements/${id}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Advertisement deleted!" });
        fetchRequests(pagination.page);
      }
    } catch {}
  };

  const tabs = [
    { key: "new" as const, label: "New Requests", color: "blue" },
    { key: "update" as const, label: "Update Requests", color: "yellow" },
    { key: "denied" as const, label: "Denied Requests", color: "red" },
  ];

  const statusBadge = (a: Advertisement) => {
    if (a.status === "pending") return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">Pending</span>;
    if (a.status === "paused") return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full">Paused</span>;
    if (a.status === "denied") return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full">Denied</span>;
    if (a.status === "approved") return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">Approved</span>;
    return <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-full capitalize">{a.status}</span>;
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Advertisement Requests</h1>
        <p className="text-gray-500 mt-1">Review and manage advertisement requests</p>
      </div>

      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              activeTab === tab.key ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {pagination.total}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h5 className="font-bold text-gray-900">
            {tabs.find(t => t.key === activeTab)?.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{pagination.total}</span>
          </h5>
          <div className="relative">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchRequests(1)} placeholder="Search by title or owner..." className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <button onClick={() => fetchRequests(1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-gray-400">Loading requests...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <h5 className="text-gray-400 font-medium">No {activeTab === "new" ? "new" : activeTab === "denied" ? "denied" : "update"} requests</h5>
            <p className="text-gray-300 text-sm mt-1">
              {activeTab === "new" ? "All advertisements are reviewed" : activeTab === "denied" ? "No denied advertisements" : "No pending updates"}
            </p>
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
                  <th className="px-5 py-3 text-center font-semibold">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {ads.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-center text-gray-500">{(pagination.page - 1) * 25 + idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {a.profile_image ? (
                            <img src={a.profile_image} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{a.title}</p>
                            <p className="text-[10px] text-gray-400">ID: #{a.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{a.owner_name || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full">
                          {a.add_type === "video_promotion" ? "Video" : "Hostel"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {a.start_date?.split("T")[0]} — {a.end_date?.split("T")[0]}
                      </td>
                      <td className="px-5 py-3">{statusBadge(a)}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <Link href={`/admin/advertisements/${a.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          {/* Approve (for pending/denied) */}
                          {(a.status === "pending" || a.status === "denied") && (
                            <button onClick={() => approveAd(a.id)} className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg" title="Approve">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          {/* Deny (for pending) */}
                          {a.status === "pending" && (
                            <button onClick={() => denyAd(a.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Deny">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                          {/* Resume (for paused) */}
                          {a.status === "paused" && (
                            <button onClick={() => approveAd(a.id)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Resume">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                            </button>
                          )}
                          {/* Delete */}
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
                  <button onClick={() => fetchRequests(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Prev</button>
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => fetchRequests(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
