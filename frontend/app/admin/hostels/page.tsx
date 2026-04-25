"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

interface Hostel {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  cover_photo: string | null;
  zone_id: number;
  zone_name: string;
  status: number;
  rating: number;
  total_rooms: number;
  total_beds: number;
  owner_name: string;
  owner_phone: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface Zone {
  id: number;
  name: string;
}

export default function HostelsPage() {
  const router = useRouter();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });

  const fetchHostels = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (zoneFilter !== "all") params.set("zone_id", zoneFilter);

      const res = await apiFetch(`/api/hostels?${params}`);
      if (res.success) {
        const data = res.data?.data || res.data || [];
        setHostels(Array.isArray(data) ? data : []);

        // Calculate stats - since we now only fetch APPROVED hostels, all are active
        const all = Array.isArray(data) ? data : [];
        setStats({
          total: all.length,
          active: all.filter((h: Hostel) => h.status === 'APPROVED').length,
          inactive: all.filter((h: Hostel) => h.status === 'PENDING' || h.status === 'REJECTED').length,
          newThisMonth: all.filter((h: Hostel) => {
            const d = new Date(h.created_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, zoneFilter]);

  const fetchZones = async () => {
    try {
      const res = await apiFetch("/api/zones");
      if (res.success) setZones(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchZones(); }, []);
  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  const deleteHostel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this hostel?")) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/hostels/${id}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Hostel deleted successfully!" });
        fetchHostels();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to delete" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (id: number, currentStatus: number) => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: currentStatus === 1 ? 0 : 1 }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Status updated!" });
        fetchHostels();
      }
    } catch { /* ignore */ }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getInitials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading hostels...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Page Header — mirrors reference vendor/list.blade.php page-header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hostels</h1>
            <p className="text-gray-500 text-sm">Manage all hostels in the system</p>
          </div>
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{stats.total}</span>
        </div>
        <button
          onClick={() => router.push("/admin/hostels/create")}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Hostel
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Cards — mirrors reference resturant-card wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-purple-100 text-sm mt-1">Total Hostels</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-purple-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.active}</p>
            <p className="text-green-100 text-sm mt-1">Active Hostels</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-green-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.inactive}</p>
            <p className="text-red-100 text-sm mt-1">Inactive Hostels</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-red-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.newThisMonth}</p>
            <p className="text-blue-100 text-sm mt-1">New This Month</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-blue-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>

      {/* Filters — mirrors reference filters card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by hostel name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          >
            <option value="all">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hostels Table — mirrors reference resturant-list-table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Hostels List</h3>
        </div>

        {hostels.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-400 text-sm">No hostels found</p>
            <button
              onClick={() => router.push("/admin/hostels/create")}
              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all"
            >
              Add First Hostel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hostel</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rooms/Beds</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hostels.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-100 shrink-0">
                          {h.logo ? (
                            <img src={h.logo} alt={h.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-sm">{getInitials(h.name)}</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{h.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{h.owner_name || "—"}</p>
                      <p className="text-xs text-gray-400">{h.owner_phone || ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">{h.zone_name || "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{h.phone || "—"}</p>
                      <p className="text-xs text-gray-400">{h.email || ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{h.total_rooms || 0} rooms</p>
                      <p className="text-xs text-gray-400">{h.total_beds || 0} beds</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{h.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        h.status === 'APPROVED'
                          ? "bg-green-100 text-green-700"
                          : h.status === 'PENDING'
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {h.status === 'APPROVED' ? "Active" : h.status === 'PENDING' ? "Pending" : "Rejected"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500">{formatDate(h.created_at)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/hostels/${h.id}/view`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => router.push(`/admin/hostels/${h.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteHostel(h.id)}
                          disabled={deleting === h.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === h.id ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
