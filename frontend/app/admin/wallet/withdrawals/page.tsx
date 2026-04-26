"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface WithdrawRequest {
  id: number;
  owner_id: number;
  owner_name: string;
  owner_email: string;
  amount: number;
  method_name: string;
  approved: number;
  transaction_note: string;
  type: string;
  created_at: string;
}

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/wallet/admin/withdrawals?page=${page}&limit=20${status ? `&status=${status}` : ""}`);
      if (res.success) {
        setRequests(res.data?.data || []);
        setTotalPages(res.data?.pagination?.totalPages || 1);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (requestId: number, approved: number) => {
    setProcessing(true);
    try {
      const res = await apiFetch("/api/wallet/admin/withdrawals", {
        method: "PUT",
        body: JSON.stringify({ request_id: requestId, approved, note }),
      });
      if (res.success) {
        setSelectedRequest(null);
        setNote("");
        fetchRequests();
      }
    } catch { /* ignore */ } finally {
      setProcessing(false);
    }
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
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Manage owner withdrawal requests</p>
        </div>
        <div className="flex gap-2">
          {["", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 text-sm rounded-xl transition-all ${
                status === s ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No withdrawal requests found</td></tr>
              ) : requests.map((req, idx) => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * 20 + idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{req.owner_name}</p>
                    <p className="text-xs text-gray-500">{req.owner_email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{formatCurrency(req.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{req.method_name || "Default"}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(req.approved)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    {req.approved === 0 ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                        >
                          Review
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{req.transaction_note || "-"}</span>
                    )}
                  </td>
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

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Review Withdrawal Request</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm font-medium text-gray-900">{selectedRequest.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedRequest.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Method:</span>
                <span className="text-sm text-gray-900">{selectedRequest.method_name || "Default"}</span>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedRequest(null); setNote(""); }}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, 2)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {processing ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, 1)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {processing ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
