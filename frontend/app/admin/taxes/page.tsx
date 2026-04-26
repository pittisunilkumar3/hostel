"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import Link from "next/link";

const sidebarItems = getSidebarItems();

interface Tax {
  id: number;
  name: string;
  rate: number;
  type: string;
  is_active: number;
  description: string | null;
  priority: number;
}

export default function TaxRatesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/taxes");
      if (res.success) setTaxes(res.data || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load taxes" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTaxes(); }, []);

  const toggleStatus = async (id: number) => {
    try {
      const res = await apiFetch(`/api/taxes/${id}/toggle`, { method: "PATCH" });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        fetchTaxes();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to toggle status" });
    }
  };

  const deleteTax = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await apiFetch(`/api/taxes/${id}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        fetchTaxes();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete tax" });
    }
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Tax Rates
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage tax rates for hostel bookings</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/taxes/settings"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
          <Link
            href="/admin/taxes/reports"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </Link>
          <Link
            href="/admin/taxes/create"
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tax Rate
          </Link>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2 text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}

      {/* Tax Rates Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">All Tax Rates</h3>
          <span className="text-sm text-gray-500">{taxes.length} tax rates</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-3 text-sm">Loading taxes...</p>
          </div>
        ) : taxes.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-gray-700 font-medium mb-1">No Tax Rates</h3>
            <p className="text-gray-400 text-sm mb-4">Create your first tax rate to start applying taxes to bookings</p>
            <Link href="/admin/taxes/create" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Tax Rate
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left py-3 px-6 font-semibold text-gray-600">#</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600">Rate</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600">Priority</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {taxes.map((tax, index) => (
                  <tr key={tax.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-gray-400">{index + 1}</td>
                    <td className="py-3.5 px-6">
                      <div>
                        <span className="font-medium text-gray-900">{tax.name}</span>
                        {tax.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{tax.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-purple-600">
                        {tax.type === "percentage" ? `${tax.rate}%` : `₹${tax.rate}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        tax.type === "percentage"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-orange-50 text-orange-700 border border-orange-200"
                      }`}>
                        {tax.type === "percentage" ? "Percentage" : "Fixed Amount"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-600">{tax.priority}</td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => toggleStatus(tax.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tax.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          tax.is_active ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/taxes/${tax.id}`}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => deleteTax(tax.id, tax.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Info Card */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-2xl p-5">
        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tax System Guide
        </h3>
        <ul className="text-sm text-purple-700 space-y-1.5">
          <li>• <strong>Percentage Tax</strong>: Calculated as % of booking amount (e.g., GST 18%)</li>
          <li>• <strong>Fixed Tax</strong>: Flat amount added per booking (e.g., ₹100 service charge)</li>
          <li>• <strong>Priority</strong>: Higher priority taxes are calculated first</li>
          <li>• <strong>Toggle</strong>: Enable/disable taxes without deleting them</li>
          <li>• Taxes are automatically applied to new bookings based on configuration</li>
        </ul>
      </div>
    </DashboardShell>
  );
}
