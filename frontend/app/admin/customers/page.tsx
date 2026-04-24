"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string;
  status: boolean;
  created_at: string;
  orders_count: number;
  total_spent: number;
  last_order_date: string | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  new_this_month: number;
}

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, new_this_month: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [showLimit, setShowLimit] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy) params.set("sort", sortBy);
      if (showLimit) params.set("limit", showLimit);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);
      params.set("page", page.toString());

      const res = await apiFetch(`/api/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data?.data || []);
        setTotal(res.data?.pagination?.total || 0);
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, showLimit, fromDate, toDate, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/customers/stats");
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await apiFetch(`/api/customers/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: !currentStatus }),
      });
      if (res.success) {
        setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, status: !currentStatus } : c));
        fetchStats();
      }
    } catch { /* ignore */ } finally {
      setTogglingId(null);
    }
  };

  const applyFilter = () => {
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      setDateError("Both From and To dates must be filled.");
      return;
    }
    setDateError("");
    setShowFilter(false);
    setPage(1);
    fetchCustomers();
  };

  const resetFilter = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("all");
    setSortBy("latest");
    setShowLimit("");
    setDateError("");
    setPage(1);
  };

  const handleExport = async (type: "excel" | "csv") => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("type", type);
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      window.open(`${API_URL}/api/customers/export?${params.toString()}&token=${token}`, "_blank");
    } catch { /* ignore */ }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  const statCards = [
    { label: "Total Customers", value: stats.total, bg: "bg-blue-50", icon: "👥", color: "text-blue-600" },
    { label: "Active Customers", value: stats.active, bg: "bg-green-50", icon: "✅", color: "text-green-600" },
    { label: "Inactive Customers", value: stats.inactive, bg: "bg-red-50", icon: "⛔", color: "text-red-600" },
    { label: "New Customers", value: stats.new_this_month, bg: "bg-amber-50", icon: "🆕", color: "text-amber-600", tooltip: "Customers who joined in the last 30 days" },
  ];

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-2xl p-4 flex items-center gap-3 border border-gray-100 relative group`}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">{card.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
            {card.tooltip && (
              <div className="absolute top-2 right-2">
                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="absolute right-0 top-6 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{card.tooltip}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Customer List Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-gray-900">
            Customer List <span className="ml-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{total}</span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search here"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 w-60"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            {/* Export */}
            <div className="relative group">
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExport("excel")} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-xl">
                  <span className="text-green-600">📊</span> Excel
                </button>
                <button onClick={() => handleExport("csv")} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-b-xl">
                  <span className="text-blue-600">📄</span> CSV
                </button>
              </div>
            </div>

            {/* Filter */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`px-4 py-2 border rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${showFilter ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Filter
              {(fromDate || statusFilter !== "all" || sortBy !== "latest") && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" placeholder="Start Date" />
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" placeholder="End Date" />
                </div>
                {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Status</label>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                  <option value="all">All Customers</option>
                  <option value="active">Active Customers</option>
                  <option value="inactive">Inactive Customers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                  <option value="latest">Default (Latest)</option>
                  <option value="top">Most Ordered</option>
                  <option value="order_amount">Most Spent</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Show Limit</label>
                <input type="number" min={1} value={showLimit} onChange={(e) => { setShowLimit(e.target.value); setPage(1); }} placeholder="Ex: 100" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={resetFilter} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300">Reset</button>
              <button onClick={applyFilter} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Apply</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer Info</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joining Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">AOV</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Last Purchase</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="text-gray-500 font-medium">No customers found</p>
                    <p className="text-gray-400 text-sm mt-1">Customers will appear here once they register</p>
                  </div>
                </td></tr>
              ) : customers.map((customer, idx) => {
                const aov = customer.orders_count > 0 ? customer.total_spent / customer.orders_count : 0;
                return (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random&size=40`}
                          alt={customer.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <Link href={`/admin/customers/${customer.id}`} className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors">{customer.name || "Incomplete profile"}</Link>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                          {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{formatDate(customer.created_at)}</div>
                      <div className="text-xs text-gray-400">{new Date(customer.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">{customer.orders_count}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">{formatCurrency(customer.total_spent)}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{formatCurrency(aov)}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {customer.last_order_date ? formatDate(customer.last_order_date) : <span className="text-gray-300">N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(customer.id, customer.status)}
                        disabled={togglingId === customer.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${customer.status ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${customer.status ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/admin/customers/${customer.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} customers</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
              {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => {
                const p = i + 1;
                return <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm ${p === page ? "bg-purple-600 text-white" : "border border-gray-200 hover:bg-gray-50"}`}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(Math.ceil(total / 20), page + 1))} disabled={page >= Math.ceil(total / 20)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
