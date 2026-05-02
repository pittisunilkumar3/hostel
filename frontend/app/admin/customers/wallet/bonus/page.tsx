"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface BonusRule {
  id: number;
  title: string;
  amount: number;
  min_add_amount: number;
  max_bonus: number;
  start_date: string;
  end_date: string;
  status: boolean;
}

export default function WalletBonusPage() {
  const [bonuses, setBonuses] = useState<BonusRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    min_add_amount: "",
    max_bonus: "",
    start_date: "",
    end_date: "",
  });

  const fetchBonuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/customers/wallet/bonus");
      if (res.success) setBonuses(res.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBonuses(); }, [fetchBonuses]);

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.min_add_amount) {
      setMessage({ type: "error", text: "Title, bonus amount, and minimum add amount are required" });
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/customers/wallet/bonus", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          min_add_amount: parseFloat(form.min_add_amount),
          max_bonus: form.max_bonus ? parseFloat(form.max_bonus) : null,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "Bonus rule created successfully" });
        setShowForm(false);
        setForm({ title: "", amount: "", min_add_amount: "", max_bonus: "", start_date: "", end_date: "" });
        fetchBonuses();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to create" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/customers/wallet/bonus/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: !currentStatus }),
      });
      fetchBonuses();
    } catch { /* ignore */ }
  };

  const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";
  const { fc: formatCurrency, fc, symbol } = useCurrency();

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Bonus</h1>
          <p className="text-gray-500 text-sm mt-1">Set up bonus rules for wallet top-ups</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Bonus Rule
        </button>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">New Bonus Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 10% Bonus" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{`Bonus Amount (${symbol})`} <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 100" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{`Min Add Amount (${symbol})`} <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.min_add_amount} onChange={(e) => setForm({ ...form, min_add_amount: e.target.value })} placeholder="e.g. 500" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{`Max Bonus (${symbol})`}</label>
              <input type="number" min={1} value={form.max_bonus} onChange={(e) => setForm({ ...form, max_bonus: e.target.value })} placeholder="Optional" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      )}

      {/* Bonus List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Bonus</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Min Add</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Max Bonus</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Start</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">End</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : bonuses.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No bonus rules yet. Click &quot;Add Bonus Rule&quot; to create one.</td></tr>
              ) : bonuses.map((b, idx) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.title}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{formatCurrency(b.amount)}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{formatCurrency(b.min_add_amount)}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{b.max_bonus ? formatCurrency(b.max_bonus) : "-"}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{formatDate(b.start_date)}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{formatDate(b.end_date)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(b.id, b.status)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${b.status ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${b.status ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
