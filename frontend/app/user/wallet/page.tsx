"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/user/sidebarItems";

const sidebarItems = getSidebarItems();

interface WalletData {
  wallet_balance: number;
  loyalty_points: number;
}

interface Transaction {
  id: number;
  transaction_id: string;
  credit: number;
  debit: number;
  admin_bonus: number;
  balance: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function UserWalletPage() {
  const [wallet, setWallet] = useState<WalletData>({ wallet_balance: 0, loyalty_points: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [showAddFund, setShowAddFund] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convertPoints, setConvertPoints] = useState("");
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await apiFetch("/api/wallet/customer/balance");
      if (res.success) setWallet(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/wallet/customer/transactions?page=${page}&limit=20${filter ? `&type=${filter}` : ""}`);
      if (res.success) {
        setTransactions(res.data?.data || []);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleAddFund = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    setAdding(true);
    try {
      const res = await apiFetch("/api/wallet/customer/add-fund", {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(addAmount), payment_method: "online" }),
      });

      if (res.success) {
        setMessage({ type: "success", text: `₹${addAmount} added to your wallet${res.data?.bonus > 0 ? ` with ₹${res.data.bonus} bonus!` : ""}` });
        setShowAddFund(false);
        setAddAmount("");
        fetchWallet();
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

  const handleConvertPoints = async () => {
    if (!convertPoints || parseInt(convertPoints) <= 0) {
      setMessage({ type: "error", text: "Please enter valid points" });
      return;
    }

    if (parseInt(convertPoints) > wallet.loyalty_points) {
      setMessage({ type: "error", text: "Insufficient loyalty points" });
      return;
    }

    setConverting(true);
    try {
      const res = await apiFetch("/api/wallet/customer/loyalty/convert", {
        method: "POST",
        body: JSON.stringify({ points: parseInt(convertPoints) }),
      });

      if (res.success) {
        setMessage({ type: "success", text: `${convertPoints} points converted to wallet` });
        setShowConvert(false);
        setConvertPoints("");
        fetchWallet();
        fetchTransactions();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to convert points" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setConverting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      add_fund: "Added Fund",
      add_fund_by_admin: "Admin Added",
      booking_payment: "Booking Payment",
      booking_refund: "Booking Refund",
      loyalty_point: "Loyalty Points",
      referrer: "Referral Bonus",
      cashback: "Cashback",
    };
    return labels[type] || type;
  };

  const getTransactionIcon = (type: string, credit: number) => {
    if (credit > 0) {
      return (
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </div>
    );
  };

  return (
    <DashboardShell role="user" title="Customer" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your wallet balance and transactions</p>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-100 text-sm">Wallet Balance</p>
              <h3 className="text-4xl font-bold mt-1">{formatCurrency(wallet.wallet_balance)}</h3>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowAddFund(true)}
            className="mt-4 px-6 py-2.5 bg-white text-emerald-600 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-all"
          >
            Add Fund
          </button>
        </div>

        {/* Loyalty Points */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-yellow-100 text-sm">Loyalty Points</p>
              <h3 className="text-4xl font-bold mt-1">{wallet.loyalty_points.toLocaleString()}</h3>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowConvert(true)}
            className="mt-4 px-6 py-2.5 bg-white text-yellow-600 rounded-xl text-sm font-semibold hover:bg-yellow-50 transition-all"
          >
            Convert to Wallet
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Transaction History</h3>
          <div className="flex gap-2">
            {["", "add_fund", "order", "loyalty_point", "cashback"].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  filter === f ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "" ? "All" : f === "add_fund" ? "Add Fund" : f === "order" ? "Orders" : f === "loyalty_point" ? "Points" : "Cashback"}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">No transactions yet</div>
          ) : transactions.map((t) => (
            <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="flex items-center gap-4">
                {getTransactionIcon(t.transaction_type, t.credit)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{getTransactionLabel(t.transaction_type)}</p>
                  <p className="text-xs text-gray-500">{t.description || "-"}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(t.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                {t.credit > 0 ? (
                  <p className="text-sm font-semibold text-green-600">+{formatCurrency(t.credit)}</p>
                ) : (
                  <p className="text-sm font-semibold text-red-600">-{formatCurrency(t.debit)}</p>
                )}
                {t.admin_bonus > 0 && (
                  <p className="text-xs text-emerald-600">+{formatCurrency(t.admin_bonus)} bonus</p>
                )}
                <p className="text-xs text-gray-400">Balance: {formatCurrency(t.balance)}</p>
              </div>
            </div>
          ))}
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

      {/* Add Fund Modal */}
      {showAddFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Fund to Wallet</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  min={1}
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddFund(false); setAddAmount(""); }}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFund}
                disabled={adding || !addAmount}
                className="flex-1 px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {adding ? "Adding..." : "Add Fund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Points Modal */}
      {showConvert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Convert Loyalty Points</h3>
            <div className="mb-4 p-3 bg-yellow-50 rounded-xl">
              <p className="text-sm text-yellow-600">Available Points</p>
              <p className="text-2xl font-bold text-yellow-900">{wallet.loyalty_points.toLocaleString()}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Points to Convert <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                max={wallet.loyalty_points}
                value={convertPoints}
                onChange={(e) => setConvertPoints(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConvert(false); setConvertPoints(""); }}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertPoints}
                disabled={converting || !convertPoints}
                className="flex-1 px-4 py-2.5 text-sm bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 disabled:opacity-50 transition-all"
              >
                {converting ? "Converting..." : "Convert Points"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
