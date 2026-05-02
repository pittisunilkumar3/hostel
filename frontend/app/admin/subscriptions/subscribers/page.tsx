"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { useCurrency } from "@/lib/useCurrency";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface RecentSubscription {
  id: number;
  hostel_id: number;
  plan_id: number;
  owner_id: number;
  start_date: string;
  end_date: string;
  amount_paid: number;
  status: string;
  payment_status: string;
  payment_method: string;
  plan_name: string;
  plan_type: string;
  hostel_name: string;
  owner_name: string;
  created_at: string;
}

interface Stats {
  total_plans: number;
  active_plans: number;
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  pending_subscriptions: number;
  grace_period_subscriptions: number;
  total_revenue: number;
  commission_hostels: number;
  subscription_hostels: number;
  recent_subscriptions: RecentSubscription[];
}

export default function AdminSubscribers() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/api/admin/subscriptions/stats");
      if (res.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to load subscription stats" });
    } finally {
      setLoading(false);
    }
  };

  const { fc: formatCurrency } = useCurrency();

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      expired: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getPlanTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      monthly: "bg-blue-50 text-blue-700",
      quarterly: "bg-purple-50 text-purple-700",
      half_yearly: "bg-amber-50 text-amber-700",
      yearly: "bg-emerald-50 text-emerald-700",
    };
    return styles[type] || "bg-gray-50 text-gray-700";
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading subscription data...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all subscription activity and hostel business model distribution</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_plans || 0}</p>
              <p className="text-xs text-gray-500">Total Plans</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_subscriptions || 0}</p>
              <p className="text-xs text-gray-500">Active Subscriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.grace_period_subscriptions || 0}</p>
              <p className="text-xs text-gray-500">In Grace Period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.total_revenue || 0)}</p>
              <p className="text-xs text-gray-500">Subscription Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Model Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Business Model Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-700">Commission Model</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats?.commission_hostels || 0} hostels</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((stats?.commission_hostels || 0) / Math.max(1, (stats?.commission_hostels || 0) + (stats?.subscription_hostels || 0))) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Subscription Model</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats?.subscription_hostels || 0} hostels</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((stats?.subscription_hostels || 0) / Math.max(1, (stats?.commission_hostels || 0) + (stats?.subscription_hostels || 0))) * 100}%`,
              }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Subscription Status Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-center">
              <p className="text-xl font-bold text-emerald-700">{stats?.active_subscriptions || 0}</p>
              <p className="text-xs text-emerald-600 font-medium">Active</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center">
              <p className="text-xl font-bold text-amber-700">{stats?.pending_subscriptions || 0}</p>
              <p className="text-xs text-amber-600 font-medium">Pending</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-center">
              <p className="text-xl font-bold text-red-700">{stats?.expired_subscriptions || 0}</p>
              <p className="text-xs text-red-600 font-medium">Expired</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-center">
              <p className="text-xl font-bold text-blue-700">{stats?.total_subscriptions || 0}</p>
              <p className="text-xs text-blue-600 font-medium">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Subscriptions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Latest subscription activities across all hostels</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hostel</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(stats?.recent_subscriptions || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No subscriptions yet</p>
                    <p className="text-gray-400 text-sm mt-1">Subscriptions will appear here once hostel owners subscribe to plans</p>
                  </td>
                </tr>
              ) : (
                (stats?.recent_subscriptions || []).map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{sub.hostel_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{sub.owner_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{sub.plan_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPlanTypeBadge(sub.plan_type)}`}>
                          {sub.plan_type === "half_yearly" ? "Half Yr" : sub.plan_type.charAt(0).toUpperCase() + sub.plan_type.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(sub.amount_paid)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(sub.status)}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(sub.payment_status)}`}>
                        {sub.payment_status.charAt(0).toUpperCase() + sub.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">{formatDate(sub.start_date)}</p>
                      <p className="text-xs text-gray-400">to {formatDate(sub.end_date)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
