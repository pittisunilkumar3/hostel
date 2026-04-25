"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface CustomerDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string;
  status: boolean;
  created_at: string;
  orders: Order[];
  total_orders: number;
  total_spent: number;
  wallet_balance: number;
  loyalty_points: number;
}

interface Order {
  id: number;
  order_id: string;
  hostel_name: string;
  check_in: string;
  check_out: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function CustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "wallet" | "loyalty">("overview");

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/customers/${id}`);
      if (res.success && res.data) {
        setCustomer(res.data);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    try {
      const res = await apiFetch(`/api/customers/${customer.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: !customer.status }),
      });
      if (res.success) {
        setCustomer({ ...customer, status: !customer.status });
      }
    } catch { /* ignore */ }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      CONFIRMED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Confirmed" },
      PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
      CANCELLED: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Cancelled" },
      COMPLETED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", label: "Completed" },
    };
    return configs[status?.toUpperCase()] || { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", dot: "bg-gray-500", label: status || "Unknown" };
  };

  const getBookingStats = () => {
    const orders = customer?.orders || [];
    return {
      total: orders.length,
      confirmed: orders.filter(o => o.status?.toUpperCase() === "CONFIRMED").length,
      pending: orders.filter(o => o.status?.toUpperCase() === "PENDING").length,
      cancelled: orders.filter(o => o.status?.toUpperCase() === "CANCELLED").length,
      completed: orders.filter(o => o.status?.toUpperCase() === "COMPLETED").length,
    };
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse" />
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full animate-spin border-t-transparent" />
            </div>
            <p className="text-gray-500 font-medium">Loading customer details...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!customer) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer Not Found</h3>
          <p className="text-gray-500 text-sm mb-6">The customer you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/admin/customers" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Customers
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const bookingStats = getBookingStats();
  const avgOrderValue = customer.total_orders > 0 ? customer.total_spent / customer.total_orders : 0;
  const lastOrder = customer.orders?.[0];

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "orders" as const, label: "Order List" },
    { id: "wallet" as const, label: "Wallet" },
    { id: "loyalty" as const, label: "Loyalty Point" },
  ];

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers" className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Details</h1>
            <p className="text-sm text-gray-500">Customer ID #{customer.id}</p>
          </div>
        </div>
        
        {/* Status Toggle */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Active Status</span>
          <button
            onClick={handleToggleStatus}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${customer.status ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${customer.status ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1.5 mb-6 inline-flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? "bg-purple-600 text-white shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Stats & Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Spent */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.total_spent)}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Total Spent</p>
                </div>
              </div>
            </div>

            {/* Last Purchase */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{lastOrder ? getTimeAgo(lastOrder.created_at) : "N/A"}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Last Purchase</p>
                </div>
              </div>
            </div>

            {/* Avg. Order Value */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgOrderValue)}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Avg. Order Value</p>
                </div>
              </div>
            </div>

            {/* Order Price Range */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {customer.orders?.length > 0 
                      ? `${formatCurrency(Math.min(...customer.orders.map(o => o.amount)))} - ${formatCurrency(Math.max(...customer.orders.map(o => o.amount)))}`
                      : "₹0 - ₹0"
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">Order price range</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Statistics Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Order Statistics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Total Orders - Large Card */}
              <div className="bg-purple-50 rounded-xl p-5 text-center border border-purple-100">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-purple-600">{customer.total_orders}</p>
                <p className="text-sm text-purple-600/70 mt-1">Total Orders</p>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-3">
                <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-700">{bookingStats.confirmed}</p>
                      <p className="text-xs text-emerald-600/70">Confirmed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 flex items-center justify-between border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-700">{bookingStats.pending}</p>
                      <p className="text-xs text-amber-600/70">Pending</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-700">{bookingStats.cancelled}</p>
                      <p className="text-xs text-red-600/70">Cancelled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Table (shown in overview) */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                <button onClick={() => setActiveTab("orders")} className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(customer.orders || []).slice(0, 5).map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-purple-600">{order.order_id}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{order.hostel_name}</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!customer.orders || customer.orders.length === 0) && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">All Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check-in</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check-out</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(customer.orders || []).length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">No orders found</td></tr>
                    ) : customer.orders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-purple-600">{order.order_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{order.hostel_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{order.check_in ? formatDate(order.check_in) : "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{order.check_out ? formatDate(order.check_out) : "—"}</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Wallet Balance</h3>
                <p className="text-4xl font-bold text-blue-600 mb-4">{formatCurrency(customer.wallet_balance)}</p>
                <p className="text-gray-500">Wallet transactions will appear here</p>
              </div>
            </div>
          )}

          {/* Loyalty Tab */}
          {activeTab === "loyalty" && (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Loyalty Points</h3>
                <p className="text-4xl font-bold text-amber-600 mb-2">{customer.loyalty_points}</p>
                <p className="text-gray-500">Points earned from bookings</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Customer Profile Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Customer Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="p-6 text-center border-b border-gray-100">
              <div className="relative inline-block mb-4">
                <img
                  src={customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=7c3aed&color=fff&size=80`}
                  alt={customer.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white ${customer.status ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {customer.status ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{customer.name || "Incomplete Profile"}</h3>
              <p className="text-sm text-gray-500 mt-1">Joined {formatDate(customer.created_at)}</p>
              
              {/* Action Icons */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <a href={`mailto:${customer.email}`} className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center hover:bg-purple-200 transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </a>
                <a href={`tel:${customer.phone}`} className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
                <Link href={`/admin/customers`} className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </Link>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 shrink-0">Phone</span>
                  <span className="text-sm font-medium text-gray-900">{customer.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 shrink-0">Email</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 shrink-0">Address</span>
                  <span className="text-sm text-purple-600 font-medium cursor-pointer hover:underline">Add Address</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(customer.wallet_balance)}</p>
              <p className="text-sm text-emerald-600/70 mt-1">Wallet Balance</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
          </div>

          {/* Loyalty Points Card */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-700">{customer.loyalty_points}</p>
              <p className="text-sm text-amber-600/70 mt-1">Loyalty Points</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
