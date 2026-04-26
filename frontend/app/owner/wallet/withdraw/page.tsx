"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";

const sidebarItems = getSidebarItems();

interface WithdrawRequest {
  id: number;
  amount: number;
  method_name: string;
  approved: number;
  transaction_note: string;
  type: string;
  created_at: string;
}

interface WithdrawMethod {
  id: number;
  withdrawal_method_id: number;
  method_name: string;
  method_fields: any;
  is_default: number;
}

export default function OwnerWithdrawPage() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [methods, setMethods] = useState<WithdrawMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, methodRes, dashRes] = await Promise.all([
        apiFetch("/api/wallet/owner/withdraw?page=1&limit=50"),
        apiFetch("/api/wallet/owner/withdraw-methods"),
        apiFetch("/api/wallet/owner/dashboard"),
      ]);

      if (reqRes.success) setRequests(reqRes.data?.data || []);
      if (methodRes.success) setMethods(methodRes.data?.saved_methods || []);
      if (dashRes.success) setWalletBalance(dashRes.data?.wallet?.balance || 0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      setMessage({ type: "error", text: "Amount exceeds available balance" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/wallet/owner/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          withdrawal_method_id: selectedMethod,
        }),
      });

      if (res.success) {
        setMessage({ type: "success", text: "Withdrawal request submitted successfully" });
        setShowModal(false);
        setAmount("");
        setSelectedMethod(null);
        fetchData();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to submit request" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const res = await apiFetch(`/api/wallet/owner/withdraw?id=${id}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "Withdrawal request cancelled" });
        fetchData();
      }
    } catch { /* ignore */ }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const getStatusBadge = (approved: number) => {
    switch (approved) {
      case 0: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      case 1: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Approved</span>;
      case 2: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Rejected</span>;
      default: return null;
    }
  };

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdraw Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your withdrawal requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
        >
          Request Withdrawal
        </button>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Note</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No withdrawal requests yet</td></tr>
              ) : requests.map((req, idx) => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{formatCurrency(req.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{req.method_name || "Default"}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(req.approved)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{req.transaction_note || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    {req.approved === 0 && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Withdrawal</h3>
            <div className="mb-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600">Available Balance</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(walletBalance)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    min={1}
                    max={walletBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Method</label>
                <select
                  value={selectedMethod || ""}
                  onChange={(e) => setSelectedMethod(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Default Method</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.withdrawal_method_id}>{m.method_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setAmount(""); setSelectedMethod(null); }}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount}
                className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
