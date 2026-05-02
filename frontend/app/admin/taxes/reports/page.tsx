"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import Link from "next/link";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface TaxSummaryItem {
  tax_id: number;
  tax_name: string;
  tax_rate: number;
  tax_type: string;
  total_bookings: number;
  total_tax_collected: number;
}

interface MonthlyBreakdown {
  month: string;
  bookings: number;
  revenue: number;
  tax_collected: number;
  total_with_tax: number;
}

interface TaxReport {
  tax_summary: TaxSummaryItem[];
  total_tax: number;
  total_bookings: number;
  monthly_breakdown: MonthlyBreakdown[];
}

export default function TaxReportsPage() {
  const [report, setReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = "/api/taxes/report";
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await apiFetch(url);
      if (res.success) setReport(res.data);
    } catch {
      console.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleFilter = () => {
    fetchReport();
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setTimeout(fetchReport, 100);
  };

  const { fc: formatCurrency } = useCurrency();

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Tax Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">View tax collection summaries and analytics</p>
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

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          {(startDate || endDate) && (
            <button
              onClick={clearFilter}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-3 text-sm">Generating report...</p>
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tax Collected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.total_tax)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Bookings with Tax</p>
                  <p className="text-2xl font-bold text-gray-900">{report.total_bookings}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Tax Types</p>
                  <p className="text-2xl font-bold text-gray-900">{report.tax_summary.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Summary Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-900">Tax Collection by Type</h3>
            </div>
            {report.tax_summary.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>No tax data found. Taxes will appear here once bookings are made with tax applied.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left py-3 px-6 font-semibold text-gray-600">Tax Name</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-600">Rate</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-600">Type</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-600">Bookings</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-600">Tax Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.tax_summary.map((item) => (
                      <tr key={item.tax_id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-6 font-medium text-gray-900">{item.tax_name}</td>
                        <td className="py-3.5 px-6 text-purple-600 font-semibold">
                          {item.tax_type === "percentage" ? `${item.tax_rate}%` : formatCurrency(item.tax_rate)}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.tax_type === "percentage" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                          }`}>
                            {item.tax_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right text-gray-600">{item.total_bookings}</td>
                        <td className="py-3.5 px-6 text-right font-semibold text-green-600">
                          {formatCurrency(item.total_tax_collected)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="py-3.5 px-6 font-bold text-gray-900" colSpan={3}>Total</td>
                      <td className="py-3.5 px-6 text-right font-bold text-gray-900">{report.total_bookings}</td>
                      <td className="py-3.5 px-6 text-right font-bold text-green-700">{formatCurrency(report.total_tax)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Breakdown */}
          {report.monthly_breakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left py-3 px-6 font-semibold text-gray-600">Month</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-600">Bookings</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-600">Revenue</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-600">Tax Collected</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.monthly_breakdown.map((item) => (
                      <tr key={item.month} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-6 font-medium text-gray-900">{item.month}</td>
                        <td className="py-3.5 px-6 text-right text-gray-600">{item.bookings}</td>
                        <td className="py-3.5 px-6 text-right text-gray-600">{formatCurrency(item.revenue)}</td>
                        <td className="py-3.5 px-6 text-right text-purple-600 font-medium">{formatCurrency(item.tax_collected)}</td>
                        <td className="py-3.5 px-6 text-right font-semibold text-gray-900">{formatCurrency(item.total_with_tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Failed to load report data</p>
        </div>
      )}
    </DashboardShell>
  );
}
