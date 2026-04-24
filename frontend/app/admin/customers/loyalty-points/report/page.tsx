"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface LoyaltyTransaction {
  id: number;
  customer_name: string;
  customer_email: string;
  points: number;
  type: "credit" | "debit";
  description: string;
  created_at: string;
}

interface LoyaltyStats {
  total_points_issued: number;
  total_points_redeemed: number;
  active_customers_with_points: number;
}

export default function LoyaltyPointsReportPage() {
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [stats, setStats] = useState<LoyaltyStats>({ total_points_issued: 0, total_points_redeemed: 0, active_customers_with_points: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await apiFetch(`/api/customers/loyalty-points/report?${params.toString()}`);
      if (res.success) {
        setTransactions(res.data?.transactions || []);
        setStats(res.data?.stats || { total_points_issued: 0, total_points_redeemed: 0, active_customers_with_points: 0 });
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const statCards = [
    { label: "Total Points Issued", value: stats.total_points_issued, icon: "⭐", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Points Redeemed", value: stats.total_points_redeemed, icon: "🎁", color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Customers", value: stats.active_customers_with_points, icon: "👥", color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Points Report</h1>
        <p className="text-gray-500 text-sm mt-1">Track loyalty points earned and redeemed by customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-2xl p-4 flex items-center gap-3 border border-gray-100`}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">{card.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-gray-900">Point Transactions</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="pl-4 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 w-56"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="all">All Types</option>
              <option value="credit">Earned</option>
              <option value="debit">Redeemed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No loyalty point transactions found</td></tr>
              ) : transactions.map((t, idx) => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{t.customer_name}</p>
                    <p className="text-xs text-gray-500">{t.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${t.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "credit" ? "+" : "-"}{t.points}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${t.type === "credit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {t.type === "credit" ? "Earned" : "Redeemed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.description || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
