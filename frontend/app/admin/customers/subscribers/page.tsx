"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface Subscriber {
  id: number;
  email: string;
  status: boolean;
  created_at: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/customers/subscribers?search=${search}`);
      if (res.success) {
        setSubscribers(res.data?.data || []);
        setTotal(res.data?.total || 0);
        setActiveCount(res.data?.active || 0);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/customers/subscribers/${id}`, { method: "DELETE" });
      if (res.success) fetchSubscribers();
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/customers/subscribers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: !currentStatus }),
      });
      fetchSubscribers();
    } catch { /* ignore */ }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscribed Emails</h1>
        <p className="text-gray-500 text-sm mt-1">Manage newsletter subscribers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">📧</div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{total}</p>
            <p className="text-xs text-gray-500">Total Subscribers</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">✅</div>
          <div>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500">Active Subscribers</p>
          </div>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Subscriber List <span className="ml-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{total}</span>
          </h3>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 w-60"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subscribed On</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No subscribers found</td></tr>
              ) : subscribers.map((s, idx) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">{s.email.charAt(0).toUpperCase()}</div>
                      <span className="text-sm font-medium text-gray-900">{s.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(s.id, s.status)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.status ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.status ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
