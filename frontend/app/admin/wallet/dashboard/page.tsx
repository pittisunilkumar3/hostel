"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface WalletDashboard {
  admin_wallet: {
    total_commission_earning: number;
    digital_received: number;
    manual_received: number;
  };
  customer_stats: {
    total_customers_with_wallet: number;
    total_wallet_balance: number;
  };
  owner_stats: {
    total_owners: number;
    total_owner_earnings: number;
    total_owner_withdrawals: number;
    total_pending_withdrawals: number;
  };
  pending_withdrawals: number;
  today_transactions: {
    count: number;
    total_credit: number;
    total_debit: number;
  };
  recent_transactions: any[];
}

export default function AdminWalletDashboardPage() {
  const [dashboard, setDashboard] = useState<WalletDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch("/api/wallet/admin/dashboard");
      if (res.success) setDashboard(res.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all wallet activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Admin Commission */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Commission</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.admin_wallet?.total_commission_earning || 0)}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Commission Earned</p>
        </div>

        {/* Total Customer Wallet Balance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{dashboard?.customer_stats?.total_customers_with_wallet || 0} users</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.customer_stats?.total_wallet_balance || 0)}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Customer Wallet Balance</p>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{dashboard?.pending_withdrawals || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">Pending Withdrawal Requests</p>
        </div>

        {/* Today&apos;s Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{dashboard?.today_transactions?.count || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Credit: {formatCurrency(dashboard?.today_transactions?.total_credit || 0)} | Debit: {formatCurrency(dashboard?.today_transactions?.total_debit || 0)}
          </p>
        </div>
      </div>

      {/* Owner Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Owner Wallet Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Total Owners</span>
              <span className="font-semibold text-gray-900">{dashboard?.owner_stats?.total_owners || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Total Earnings</span>
              <span className="font-semibold text-green-600">{formatCurrency(dashboard?.owner_stats?.total_owner_earnings || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Total Withdrawn</span>
              <span className="font-semibold text-blue-600">{formatCurrency(dashboard?.owner_stats?.total_owner_withdrawals || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Pending Withdrawals</span>
              <span className="font-semibold text-orange-600">{formatCurrency(dashboard?.owner_stats?.total_pending_withdrawals || 0)}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dashboard?.recent_transactions?.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No transactions yet</td></tr>
                ) : dashboard?.recent_transactions?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{t.user_name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        t.credit > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${t.credit > 0 ? "text-green-600" : "text-red-600"}`}>
                        {t.credit > 0 ? "+" : "-"}{formatCurrency(t.credit > 0 ? t.credit : t.debit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Wallet Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Platform Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-600 mb-1">Total Commission</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(dashboard?.admin_wallet?.total_commission_earning || 0)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-600 mb-1">Digital Received</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(dashboard?.admin_wallet?.digital_received || 0)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-green-600 mb-1">Manual Received</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(dashboard?.admin_wallet?.manual_received || 0)}</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
