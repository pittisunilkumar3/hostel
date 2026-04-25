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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
      CANCELLED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      COMPLETED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    };
    return configs[status?.toUpperCase()] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
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
          <Link href="/admin/customers" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/25">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Customers
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "📊", count: null },
    { id: "orders" as const, label: "Bookings", icon: "📋", count: customer.total_orders },
    { id: "wallet" as const, label: "Wallet", icon: "💰", count: null },
    { id: "loyalty" as const, label: "Loyalty", icon: "⭐", count: customer.loyalty_points },
  ];

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Back Button */}
      <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 mb-6 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Customers
      </Link>

      {/* Customer Hero Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Gradient Cover */}
        <div className="h-32 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute right-8 top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        </div>
        
        {/* Profile Section */}
        <div className="px-8 pb-6 -mt-14">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-500">
                <img
                  src={customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=7c3aed&color=fff&size=96`}
                  alt={customer.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center ${customer.status ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {customer.status ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name || "Incomplete Profile"}</h1>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${customer.status ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {customer.status ? "● Active" : "● Inactive"}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  ID: #{customer.id}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    {customer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  Joined {formatDate(customer.created_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleToggleStatus}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  customer.status 
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" 
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                {customer.status ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    Deactivate
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100">
          <div className="px-6 py-5 text-center border-r border-gray-100 hover:bg-purple-50/50 transition-colors group cursor-default">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-2xl font-bold text-purple-600">{customer.total_orders}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Bookings</p>
          </div>
          <div className="px-6 py-5 text-center border-r border-gray-100 hover:bg-emerald-50/50 transition-colors group cursor-default">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(customer.total_spent)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Spent</p>
          </div>
          <div className="px-6 py-5 text-center border-r border-gray-100 hover:bg-blue-50/50 transition-colors group cursor-default">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(customer.wallet_balance)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Wallet Balance</p>
          </div>
          <div className="px-6 py-5 text-center hover:bg-amber-50/50 transition-colors group cursor-default">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <p className="text-2xl font-bold text-amber-600">{customer.loyalty_points}</p>
            <p className="text-xs text-gray-500 mt-0.5">Loyalty Points</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100/80 p-1.5 rounded-2xl w-fit backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? "bg-white text-purple-700 shadow-md shadow-purple-100" 
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Recent Bookings</h3>
                  <p className="text-xs text-gray-400">Latest booking activity</p>
                </div>
              </div>
              <button onClick={() => setActiveTab("orders")} className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 hover:underline">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {(customer.orders || []).slice(0, 5).map((order, idx) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-bold text-gray-500">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.order_id}</p>
                        <p className="text-xs text-gray-500">{order.hostel_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(order.amount)}</p>
                        <p className="text-xs text-gray-400">{order.check_in ? formatDate(order.check_in) : ""}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!customer.orders || customer.orders.length === 0) && (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <p className="text-gray-500 font-medium">No bookings yet</p>
                  <p className="text-gray-400 text-xs mt-1">Bookings will appear here once created</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Contact Details</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{customer.name || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Email</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{customer.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Member Since</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(customer.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
              <h3 className="text-sm font-semibold text-purple-200 mb-3">Customer Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-200">Avg. Order Value</span>
                  <span className="text-sm font-bold">{customer.total_orders > 0 ? formatCurrency(customer.total_spent / customer.total_orders) : "₹0"}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5" style={{ width: `${Math.min((customer.total_orders / 10) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-purple-300">{customer.total_orders} of 10 orders to next tier</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">All Bookings</h3>
                <p className="text-xs text-gray-400">{customer.total_orders} total bookings</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hostel</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-out</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(customer.orders || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <p className="text-gray-500 font-medium">No bookings found</p>
                      <p className="text-gray-400 text-xs mt-1">This customer hasn&apos;t made any bookings yet</p>
                    </td>
                  </tr>
                ) : customer.orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">{order.order_id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{order.hostel_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.check_in ? formatDate(order.check_in) : <span className="text-gray-300">—</span>}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.check_out ? formatDate(order.check_out) : <span className="text-gray-300">—</span>}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(order.amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {order.status}
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

      {activeTab === "wallet" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Wallet</h3>
          </div>
          <div className="p-8">
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Wallet Balance</h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">{formatCurrency(customer.wallet_balance)}</p>
              <p className="text-gray-400 text-sm">Current available balance</p>
              
              <div className="mt-8 max-w-sm mx-auto">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Added</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Total Spent</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "loyalty" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Loyalty Points</h3>
          </div>
          <div className="p-8">
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Loyalty Points</h3>
              <p className="text-4xl font-bold text-amber-600 mb-2">{customer.loyalty_points} Points</p>
              <p className="text-gray-400 text-sm">Equivalent to {formatCurrency(customer.loyalty_points * 10)} discount</p>
              
              <div className="mt-8 max-w-sm mx-auto">
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-amber-700 font-medium">Points to Next Reward</span>
                    <span className="font-bold text-amber-800">{Math.max(0, 500 - customer.loyalty_points)} pts</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full h-3 transition-all duration-500" 
                      style={{ width: `${Math.min((customer.loyalty_points / 500) * 100, 100)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">{customer.loyalty_points} / 500 points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
