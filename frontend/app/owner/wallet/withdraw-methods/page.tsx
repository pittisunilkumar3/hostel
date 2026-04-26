"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";

const sidebarItems = getSidebarItems();

interface WithdrawMethod {
  id: number;
  withdrawal_method_id: number;
  method_name: string;
  method_fields: any;
  is_default: number;
  is_active: number;
}

interface GlobalMethod {
  id: number;
  method_name: string;
  method_fields: any;
}

export default function OwnerWithdrawMethodsPage() {
  const [savedMethods, setSavedMethods] = useState<WithdrawMethod[]>([]);
  const [globalMethods, setGlobalMethods] = useState<GlobalMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGlobalMethod, setSelectedGlobalMethod] = useState<number | null>(null);
  const [methodFields, setMethodFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/wallet/owner/withdraw-methods");
      if (res.success) {
        setSavedMethods(res.data?.saved_methods || []);
        setGlobalMethods(res.data?.available_methods || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const handleAddMethod = async () => {
    if (!selectedGlobalMethod) {
      setMessage({ type: "error", text: "Please select a withdrawal method" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/wallet/owner/withdraw-methods", {
        method: "POST",
        body: JSON.stringify({
          withdrawal_method_id: selectedGlobalMethod,
          method_fields: methodFields,
        }),
      });

      if (res.success) {
        setMessage({ type: "success", text: "Withdrawal method added successfully" });
        setShowAddModal(false);
        setSelectedGlobalMethod(null);
        setMethodFields({});
        fetchMethods();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to add method" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (methodId: number) => {
    try {
      const res = await apiFetch("/api/wallet/owner/withdraw-methods", {
        method: "PUT",
        body: JSON.stringify({ action: "set_default", method_id: methodId }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "Default method updated" });
        fetchMethods();
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (methodId: number) => {
    if (!confirm("Are you sure you want to delete this method?")) return;

    try {
      const res = await apiFetch(`/api/wallet/owner/withdraw-methods?id=${methodId}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "Method deleted successfully" });
        fetchMethods();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to delete method" });
      }
    } catch { /* ignore */ }
  };

  const getMethodFields = (methodId: number) => {
    const method = globalMethods.find((m) => m.id === methodId);
    if (!method) return {};
    try {
      return JSON.parse(method.method_fields);
    } catch {
      return {};
    }
  };

  const selectedMethodFields = selectedGlobalMethod ? getMethodFields(selectedGlobalMethod) : {};

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Methods</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your saved withdrawal methods</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
        >
          Add Method
        </button>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : savedMethods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal Methods</h3>
          <p className="text-sm text-gray-500 mb-6">Add a withdrawal method to receive your earnings</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            Add Your First Method
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedMethods.map((method) => (
            <div key={method.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${method.is_default ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100"}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{method.method_name}</h3>
                  {method.is_default === 1 && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Default</span>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  {Object.entries(method.method_fields || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}:</span>
                      <span className="text-gray-900 font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {method.is_default !== 1 && (
                    <button
                      onClick={() => handleSetDefault(method.withdrawal_method_id)}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="px-3 py-2 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Withdrawal Method</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Method <span className="text-red-500">*</span></label>
                <select
                  value={selectedGlobalMethod || ""}
                  onChange={(e) => {
                    setSelectedGlobalMethod(e.target.value ? parseInt(e.target.value) : null);
                    setMethodFields({});
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Choose a method...</option>
                  {globalMethods.map((m) => (
                    <option key={m.id} value={m.id}>{m.method_name}</option>
                  ))}
                </select>
              </div>

              {selectedGlobalMethod && Object.entries(selectedMethodFields).map(([key, field]: [string, any]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label || key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={methodFields[key] || ""}
                    onChange={(e) => setMethodFields({ ...methodFields, [key]: e.target.value })}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setSelectedGlobalMethod(null); setMethodFields({}); }}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMethod}
                disabled={submitting || !selectedGlobalMethod}
                className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {submitting ? "Adding..." : "Add Method"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
