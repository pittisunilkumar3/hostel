"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface CustomerWallet {
  id: number;
  name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  loyalty_points: number;
  total_credit: number;
  total_debit: number;
  total_bonus: number;
  transaction_count: number;
  last_transaction: string;
}

interface Summary {
  total_customers: number;
  total_balance: number;
  total_loyalty_points: number;
}

export default function AdminCustomerReportPage() {
  const [customers, setCustomers] = useState<CustomerWallet[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/wallet/admin/customer-report?page=${page}&limit=20&search=${search}`);
      if (res.success) {
        setCustomers(res.data?.data || []);
        setSummary(res.data?.summary || null);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Wallet Report</h1>
        <p className="text-gray-500 text-sm mt-1">View all customer wallet balances and transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{summary?.total_customers || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">Customers with Wallet</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.total_balance || 0)}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Wallet Balance</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{(summary?.total_loyalty_points || 0).toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Loyalty Points</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Customer Wallet List</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers..."
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Wallet Balance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Loyalty Points</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Credit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Debit</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Transactions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No customers found</td></tr>
              ) : customers.map((customer, idx) => (
                <tr key={customer.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * 20 + idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">{formatCurrency(customer.wallet_balance)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-yellow-600">{customer.loyalty_points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(customer.total_credit)}</td>
                  <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(customer.total_debit)}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{customer.transaction_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(customer.last_transaction)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
