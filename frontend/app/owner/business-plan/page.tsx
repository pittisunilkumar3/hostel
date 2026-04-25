"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import SupportChat from "@/app/components/SupportChat";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

export default function OwnerBusinessPlan() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/owner"); return; }
    setUser(u);
    fetchPlan();
  }, [router]);

  const fetchPlan = async () => {
    try {
      const res = await apiFetch("/api/owner/business-plan");
      if (res.success && res.data?.plan) {
        setPlan(res.data.plan);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading business plan...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Business Plan</h1>
        <p className="text-gray-500 mt-1">View your hostel's business plan, commission details, and performance metrics.</p>
      </div>

      {/* Plan Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-10" />
        <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-semibold text-emerald-200">Hostel Business Plan</span>
          </div>
          <h2 className="text-2xl font-bold capitalize">{plan?.business_model || "Commission"} Model</h2>
          <p className="text-emerald-200 mt-1 text-sm">
            {plan?.business_model === "commission"
              ? `${plan?.commission_rate || 12}% platform commission on each booking`
              : "Subscription-based model with recurring payments"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Rooms",
            value: plan?.total_rooms || 0,
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            color: "emerald",
          },
          {
            label: "Total Beds",
            value: plan?.total_beds || 0,
            icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
            color: "blue",
          },
          {
            label: "Occupancy Rate",
            value: `${plan?.occupancy_rate || 0}%`,
            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            color: "amber",
          },
          {
            label: "Commission Rate",
            value: `${plan?.commission_rate || 12}%`,
            icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
            color: "purple",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-50`}>
                <svg className={`w-5 h-5 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hostel Info */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Hostel Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Hostel Name</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.hostel_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                plan?.hostel_status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                plan?.hostel_status === "PENDING" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {plan?.hostel_status || "—"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Joined Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(plan?.joined_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Address</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.hostel_address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Phone</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.hostel_phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.hostel_email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Check-in Time</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.check_in_time || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Check-out Time</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.check_out_time || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Zone</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.zone_name || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Commission Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">How your earnings are calculated</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Potential Monthly Revenue</p>
                  <p className="text-xs text-gray-500">Based on all rooms at full capacity</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(plan?.potential_monthly_revenue || 0)}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Platform Commission ({plan?.commission_rate || 12}%)</p>
                  <p className="text-xs text-amber-600">Deducted from revenue</p>
                </div>
              </div>
              <p className="text-lg font-bold text-amber-700">- {formatCurrency(plan?.commission_amount || 0)}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Your Net Earnings</p>
                    <p className="text-xs text-emerald-600">Amount after commission deduction</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(plan?.net_earnings || 0)}</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">How it works</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  The platform charges a {plan?.commission_rate || 12}% commission on each confirmed booking.
                  This commission is automatically deducted from the booking amount.
                  Your net earnings are the remaining amount after the commission deduction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Support Chat Button */}
      <SupportChat chatWith="admin" userRole="owner" accentColor="emerald" />
    </DashboardShell>
  );
}
