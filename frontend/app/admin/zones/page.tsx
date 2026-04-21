"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

interface Zone {
  id: number;
  name: string;
  display_name: string | null;
  status: number;
  is_default: number;
  hostels_count: number;
  minimum_service_charge: number | null;
  per_km_service_charge: number | null;
  created_at: string;
}

export default function ZonesListPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/zones${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (res.success) setZones(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/zones/${id}`, { method: "DELETE" });
      if (res.success) fetchZones();
      else alert(res.message || "Failed to delete");
    } catch { alert("Network error"); }
    setDeleting(null);
  };

  const toggleStatus = async (id: number, currentStatus: number) => {
    try {
      const res = await apiFetch(`/api/zones/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: !currentStatus }),
      });
      if (res.success) fetchZones();
    } catch { /* ignore */ }
  };

  const setDefault = async (id: number) => {
    try {
      const res = await apiFetch(`/api/zones/${id}/default`, { method: "PATCH" });
      if (res.success) fetchZones();
    } catch { /* ignore */ }
  };

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Zones</h1>
            <p className="text-gray-500 text-sm">Manage geographic zones for hostel coverage</p>
          </div>
        </div>
        <button onClick={() => router.push("/admin/zones/create")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add New Zone
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by zone name..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <h3 className="text-lg font-semibold text-gray-400">No zones found</h3>
          <p className="text-gray-400 text-sm mt-1">Create your first business zone to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">SL</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Zone ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Display Name</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Hostels</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Default</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {zones.map((zone, idx) => (
                  <tr key={zone.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 text-center font-mono">#{zone.id}</td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                      {(!zone.minimum_service_charge || !zone.per_km_service_charge) && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          ⚠ Setup Required
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{zone.display_name || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 text-center">{zone.hostels_count || 0}</td>
                    <td className="px-4 py-4 text-center">
                      {zone.is_default ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Default
                        </span>
                      ) : (
                        <button onClick={() => setDefault(zone.id)}
                          className="px-3 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          Make Default
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => toggleStatus(zone.id, zone.status)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${zone.status ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${zone.status ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => router.push(`/admin/zones/${zone.id}/edit`)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Zone">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => router.push(`/admin/zones/${zone.id}/settings`)}
                          className={`p-2 rounded-lg transition-all ${(!zone.minimum_service_charge || !zone.per_km_service_charge) ? "text-amber-600 hover:bg-amber-50" : "text-gray-500 hover:bg-gray-100"}`} title="Zone Settings">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(zone.id)} disabled={deleting === zone.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50" title="Delete Zone">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Total: {zones.length} zone{zones.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
