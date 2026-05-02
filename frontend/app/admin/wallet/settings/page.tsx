"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface WalletSettings {
  wallet_status: string;
  wallet_add_refund: string;
  loyalty_point_status: string;
  loyalty_point_exchange_rate: string;
  loyalty_point_item_purchase_point: string;
  min_owner_withdraw_amount: string;
  owner_commission_rate: string;
  customer_add_fund_min_amount: string;
}

export default function AdminWalletSettingsPage() {
  const { fc, symbol } = useCurrency();
  const [settings, setSettings] = useState<WalletSettings>({
    wallet_status: "1",
    wallet_add_refund: "1",
    loyalty_point_status: "1",
    loyalty_point_exchange_rate: "10",
    loyalty_point_item_purchase_point: "5",
    min_owner_withdraw_amount: "100",
    owner_commission_rate: "10",
    customer_add_fund_min_amount: "0",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch("/api/wallet/admin/settings");
      if (res.success && res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/wallet/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      if (res.success) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof WalletSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure wallet and loyalty point settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-900">Wallet Configuration</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Enable Wallet</p>
                <p className="text-xs text-gray-500">Allow customers to use wallet for payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wallet_status === "1"}
                  onChange={(e) => handleChange("wallet_status", e.target.checked ? "1" : "0")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Refund to Wallet</p>
                <p className="text-xs text-gray-500">Automatically add refunds to customer wallet</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wallet_add_refund === "1"}
                  onChange={(e) => handleChange("wallet_add_refund", e.target.checked ? "1" : "0")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Add Fund Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{symbol}</span>
                <input
                  type="number"
                  min={0}
                  value={settings.customer_add_fund_min_amount}
                  onChange={(e) => handleChange("customer_add_fund_min_amount", e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Owner Withdraw Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{symbol}</span>
                <input
                  type="number"
                  min={0}
                  value={settings.min_owner_withdraw_amount}
                  onChange={(e) => handleChange("min_owner_withdraw_amount", e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Commission Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.owner_commission_rate}
                onChange={(e) => handleChange("owner_commission_rate", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>
        </div>

        {/* Loyalty Points Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-900">Loyalty Points Configuration</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Enable Loyalty Points</p>
                <p className="text-xs text-gray-500">Allow customers to earn loyalty points</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.loyalty_point_status === "1"}
                  onChange={(e) => handleChange("loyalty_point_status", e.target.checked ? "1" : "0")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate (Points per {symbol}1)</label>
              <input
                type="number"
                min={1}
                value={settings.loyalty_point_exchange_rate}
                onChange={(e) => handleChange("loyalty_point_exchange_rate", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
              <p className="text-xs text-gray-500 mt-1">How many points equal {symbol}1 when converting</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points per Purchase (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.loyalty_point_item_purchase_point}
                onChange={(e) => handleChange("loyalty_point_item_purchase_point", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage of booking amount earned as points</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Example Calculation</h4>
              <p className="text-xs text-purple-700">
                If a customer makes a booking of {symbol}1,000:
                <br />• Points earned: {symbol}1,000 × {settings.loyalty_point_item_purchase_point}% = {Math.floor(1000 * parseFloat(settings.loyalty_point_item_purchase_point || "5") / 100)} points
                <br />• Points value: {Math.floor(1000 * parseFloat(settings.loyalty_point_item_purchase_point || "5") / 100)} ÷ {settings.loyalty_point_exchange_rate} = {fc(Math.floor(1000 * parseFloat(settings.loyalty_point_item_purchase_point || "5") / 100) / parseFloat(settings.loyalty_point_exchange_rate || "10"))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
