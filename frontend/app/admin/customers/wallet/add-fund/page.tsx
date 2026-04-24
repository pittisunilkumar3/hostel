"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  wallet_balance: number;
}

interface Transaction {
  id: number;
  customer_name: string;
  customer_email: string;
  amount: number;
  type: string;
  note: string;
  created_at: string;
}

export default function WalletAddFundPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/customers?search=${search}&limit=20`);
      if (res.success) setCustomers(res.data?.data || []);
    } catch { /* ignore */ }
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/customers/wallet/add-fund");
      if (res.success) setTransactions(res.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleAddFund = async () => {
    if (!selectedCustomer || !amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please select a customer and enter a valid amount" });
      return;
    }

    setAdding(true);
    try {
      const res = await apiFetch("/api/customers/wallet/add-fund", {
        method: "POST",
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          amount: parseFloat(amount),
          note,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `₹${amount} added to ${selectedCustomer.name}'s wallet` });
        setSelectedCustomer(null);
        setAmount("");
        setNote("");
        fetchTransactions();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to add fund" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Fund to Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manually add funds to a customer&apos;s wallet</p>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Fund Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Add Fund</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                {search && customers.length > 0 && !selectedCustomer && (
                  <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCustomer(c); setSearch(""); }}
                        className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">{c.name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">{selectedCustomer.name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">{selectedCustomer.name}</p>
                      <p className="text-xs text-purple-600">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-purple-400 hover:text-purple-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for adding fund..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                />
              </div>

              <button
                onClick={handleAddFund}
                disabled={adding || !selectedCustomer || !amount}
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all"
              >
                {adding ? "Adding..." : "Add Fund"}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Recent Fund Additions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Note</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transactions yet</td></tr>
                  ) : transactions.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{t.customer_name}</p>
                        <p className="text-xs text-gray-500">{t.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">+{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.note || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
