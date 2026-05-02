"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import Link from "next/link";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface TaxConfig {
  id: number;
  config_key: string;
  config_value: string;
  is_active: number;
}

export default function TaxSettingsPage() {
  const [configs, setConfigs] = useState<TaxConfig[]>([]);
  const { fc, symbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable states
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [taxRounding, setTaxRounding] = useState("standard");
  const [taxDisplay, setTaxDisplay] = useState("itemized");
  const [applyOnDiscount, setApplyOnDiscount] = useState(true);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/taxes/config");
      if (res.success) {
        const data: TaxConfig[] = res.data || [];
        setConfigs(data);

        // Parse config values
        data.forEach((c) => {
          switch (c.config_key) {
            case "tax_inclusive":
              setTaxInclusive(c.config_value === "1");
              break;
            case "tax_rounding":
              setTaxRounding(c.config_value);
              break;
            case "tax_display":
              setTaxDisplay(c.config_value);
              break;
            case "apply_tax_on_discount":
              setApplyOnDiscount(c.config_value !== "0");
              break;
          }
        });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load tax settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, { value: string; active: boolean }> = {
        tax_inclusive: { value: taxInclusive ? "1" : "0", active: true },
        tax_rounding: { value: taxRounding, active: true },
        tax_display: { value: taxDisplay, active: true },
        apply_tax_on_discount: { value: applyOnDiscount ? "1" : "0", active: true },
      };

      const res = await apiFetch("/api/taxes/config", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (res.success) {
        setMessage({ type: "success", text: "✅ Tax settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tax Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure how taxes are calculated and displayed</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/taxes"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Taxes
          </Link>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-3 text-sm">Loading settings...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tax Calculation Mode */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base font-bold text-gray-900">Tax Calculation Mode</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Tax Inclusive/Exclusive */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tax Inclusion
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTaxInclusive(false)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      !taxInclusive
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !taxInclusive ? "border-purple-500 bg-purple-500" : "border-gray-300"
                      }`}>
                        {!taxInclusive && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="font-semibold text-gray-900">Tax Excluded</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      Tax is added on top of the room price. Customer sees: Room {symbol}10,000 + Tax {symbol}1,800 = {symbol}11,800
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxInclusive(true)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      taxInclusive
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        taxInclusive ? "border-purple-500 bg-purple-500" : "border-gray-300"
                      }`}>
                        {taxInclusive && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="font-semibold text-gray-900">Tax Included</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      Tax is already included in the room price. Customer sees: Room {symbol}10,000 (incl. {symbol}1,525 tax)
                    </p>
                  </button>
                </div>
              </div>

              {/* Rounding */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tax Rounding
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "standard", label: "Standard", desc: "Round to nearest (0.5 → 1)" },
                    { value: "up", label: "Round Up", desc: "Always round up" },
                    { value: "down", label: "Round Down", desc: "Always round down" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTaxRounding(option.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        taxRounding === option.value
                          ? "border-purple-400 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          taxRounding === option.value ? "border-purple-500 bg-purple-500" : "border-gray-300"
                        }`}>
                          {taxRounding === option.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h3 className="text-base font-bold text-gray-900">Display Settings</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Display Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tax Display Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTaxDisplay("itemized")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      taxDisplay === "itemized"
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        taxDisplay === "itemized" ? "border-purple-500 bg-purple-500" : "border-gray-300"
                      }`}>
                        {taxDisplay === "itemized" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="font-semibold text-gray-900">Itemized</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      Show each tax separately: CGST {symbol}900, SGST {symbol}900
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxDisplay("combined")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      taxDisplay === "combined"
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        taxDisplay === "combined" ? "border-purple-500 bg-purple-500" : "border-gray-300"
                      }`}>
                        {taxDisplay === "combined" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="font-semibold text-gray-900">Combined</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      Show total tax: Tax {symbol}1,800 (18%)
                    </p>
                  </button>
                </div>
              </div>

              {/* Apply on Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tax on Discounted Amount
                </label>
                <button
                  type="button"
                  onClick={() => setApplyOnDiscount(!applyOnDiscount)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    applyOnDiscount
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div>
                    <span className="font-semibold text-gray-900">
                      {applyOnDiscount ? "Yes, calculate tax after discount" : "No, calculate tax on original amount"}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {applyOnDiscount
                        ? "If room is {symbol}10,000 with {symbol}1,000 discount, tax is on {symbol}9,000"
                        : "If room is {symbol}10,000 with {symbol}1,000 discount, tax is on {symbol}10,000"}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${applyOnDiscount ? "bg-green-500" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${applyOnDiscount ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
            <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Example Calculation
            </h3>
            <div className="bg-white rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Room Price (per month)</span>
                <span className="font-medium">{symbol}10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">3 months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">{symbol}30,000</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between text-purple-700">
                <span>CGST (9%)</span>
                <span className="font-medium">{symbol}2,700</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>SGST (9%)</span>
                <span className="font-medium">{symbol}2,700</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{symbol}35,400</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * Based on current settings: Tax {taxInclusive ? "Included" : "Excluded"}, {taxDisplay} display
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
