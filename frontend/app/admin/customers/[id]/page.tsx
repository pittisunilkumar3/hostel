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

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
        </div>
      </DashboardShell>
    );
  }

  if (!customer) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="text-gray-500 font-medium">Customer not found</p>
          <Link href="/admin/customers" className="mt-3 inline-flex px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700">Back to Customers</Link>
        </div>
      </DashboardShell>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "📊" },
    { id: "orders" as const, label: "Orders", icon: "📋" },
    { id: "wallet" as const, label: "Wallet", icon: "💰" },
    { id: "loyalty" as const, label: "Loyalty Points", icon: "⭐" },
  ];

  return (
    <DashboardShell
      role="admin" title="Super Admin" items={sidebarItems}
      accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10"
    >
      {/* Back Button */}
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Customers
      </Link>

      {/* Customer Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600" />
        
        {/* Profile */}
        <div className="px-6 pb-5 -mt-10">
          <div className="flex items-end gap-4">
            <img
              src={customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=7c3aed&color=fff&size=80`}
              alt={customer.name}
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
            />
            <div className="flex-1 pt-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{customer.name || "Incomplete Profile"}</h1>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${customer.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {customer.status ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {customer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Joined {formatDate(customer.created_at)}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${customer.status ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
            >
              {customer.status ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 border-t border-gray-100">
          <div className="px-6 py-4 text-center border-r border-gray-100">
            <p className="text-2xl font-bold text-purple-600">{customer.total_orders}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
          <div className="px-6 py-4 text-center border-r border-gray-100">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.total_spent)}</p>
            <p className="text-xs text-gray-500">Total Spent</p>
          </div>
          <div className="px-6 py-4 text-center border-r border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(customer.wallet_balance)}</p>
            <p className="text-xs text-gray-500">Wallet Balance</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{customer.loyalty_points}</p>
            <p className="text-xs text-gray-500">Loyalty Points</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
              <button onClick={() => setActiveTab("orders")} className="text-sm text-purple-600 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-gray-50">
              {(customer.orders || []).slice(0, 5).map((order) => (
                <div key={order.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_id}</p>
                    <p className="text-xs text-gray-500">{order.hostel_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === "confirmed" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                  </div>
                </div>
              ))}
              {(!customer.orders || customer.orders.length === 0) && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No orders yet</div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Customer Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{customer.name || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{customer.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(customer.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">All Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check-out</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(customer.orders || []).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
                ) : customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-purple-600">{order.order_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.hostel_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.check_in ? formatDate(order.check_in) : "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.check_out ? formatDate(order.check_out) : "-"}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${order.status === "confirmed" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : order.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Wallet Balance</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">{formatCurrency(customer.wallet_balance)}</p>
            <p className="text-gray-500 text-sm">Wallet transactions will appear here</p>
          </div>
        </div>
      )}

      {activeTab === "loyalty" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Loyalty Points</h3>
            <p className="text-3xl font-bold text-amber-600 mb-4">{customer.loyalty_points} Points</p>
            <p className="text-gray-500 text-sm">Loyalty point transactions will appear here</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
