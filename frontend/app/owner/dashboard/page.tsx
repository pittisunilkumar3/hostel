"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import StatCard from "@/app/components/StatCard";
import { getCurrentUser, apiFetch } from "@/lib/auth";
import { useRouter } from "next/navigation";

import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const sidebarItems = getSidebarItems();

interface Room {
  id: number;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  type: string;
  status: string;
  price_per_month: number;
  amenities: string;
}

type HostelStatus = "loading" | "no_hostel" | "pending" | "rejected" | "approved";

interface SubscriptionHostelStatus {
  hostel_id: number;
  hostel_name: string;
  business_model: string;
  subscription_status: string;
  message: string | null;
  grace_days_left: number;
  end_date: string | null;
  plan_name: string | null;
}

interface SubscriptionStatusData {
  hostels: SubscriptionHostelStatus[];
  needs_warning_popup: boolean;
  needs_block_popup: boolean;
  needs_subscription_popup: boolean;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [hostelStatus, setHostelStatus] = useState<HostelStatus>("loading");
  const { fc, symbol } = useCurrency();
  const [hostelData, setHostelData] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subscription popup states
  const [subStatusData, setSubStatusData] = useState<SubscriptionStatusData | null>(null);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [showNoSubPopup, setShowNoSubPopup] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.push("/login/owner");
      return;
    }
    setUser(u);
    checkHostelStatus();
  }, [router]);

  // Redirect to registration if no hostel (must be before any early returns)
  useEffect(() => {
    if (!loading && hostelStatus === "no_hostel") {
      router.push("/owner/register-hostel");
    }
  }, [hostelStatus, loading, router]);

  const checkHostelStatus = async () => {
    try {
      const res = await apiFetch("/api/owner/hostel/status");
      console.log("Hostel status response:", res);

      if (res.success && res.data) {
        const data = res.data;
        setHostelData(data);

        if (!data.hostel) {
          // No hostel registered
          setHostelStatus("no_hostel");
        } else if (data.status === "pending" || data.status === 0) {
          setHostelStatus("pending");
        } else if (data.status === "rejected" || data.status === 2) {
          setHostelStatus("rejected");
        } else if (data.status === "approved" || data.status === 1) {
          setHostelStatus("approved");
          fetchRooms();
          fetchBookingStats();
        } else {
          setHostelStatus("pending");
        }
      } else {
        // API error or no data - assume no hostel
        setHostelStatus("no_hostel");
      }
    } catch (e) {
      console.error(e);
      setHostelStatus("no_hostel");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await apiFetch("/api/rooms?page=1&limit=10");
      if (res.success) setRooms(res.data?.rooms || []);
    } catch (e) { console.error(e); }
  };

  const fetchBookingStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/owner/bookings?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBookingStats(data.data.stats);
    } catch {}
  };

  // Check subscription status for popup
  const checkSubscriptionStatus = async () => {
    try {
      const res = await apiFetch("/api/owner/subscriptions/status");
      if (res.success && res.data) {
        setSubStatusData(res.data);
        if (res.data.needs_warning_popup) setShowWarningPopup(true);
        if (res.data.needs_block_popup) setShowBlockedPopup(true);
        if (res.data.needs_subscription_popup) setShowNoSubPopup(true);
      }
    } catch (e) { console.error(e); }
  };

  // Check subscription when hostel is approved
  useEffect(() => {
    if (hostelStatus === "approved") {
      checkSubscriptionStatus();
    }
  }, [hostelStatus]);

  // Loading state
  if (loading || hostelStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-emerald-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-emerald-300/60 text-sm">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (hostelStatus === "no_hostel") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-emerald-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-emerald-300/60 text-sm">Redirecting to registration...</p>
        </div>
      </div>
    );
  }

  // Pending status - show under review message
  if (hostelStatus === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Hostel Management</h1>
                <p className="text-xs text-emerald-300/60">Owner Portal</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login/owner");
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-emerald-900/20 border border-white/10 text-center">
            {/* Pending Animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Under Review</h2>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-yellow-300 text-sm font-medium mb-1">We&apos;re reviewing your hostel details</p>
                  <p className="text-yellow-300/70 text-xs leading-relaxed">
                    Thank you for submitting your hostel registration! Our admin team is currently reviewing your application. We will get back to you as soon as possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Hostel Info */}
            {hostelData?.hostel && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {hostelData.hostel.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{hostelData.hostel.name}</p>
                    <p className="text-xs text-gray-400">{hostelData.hostel.address}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-left">Your application has been received</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-left">Review typically takes 1-2 business days</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-left">We&apos;ll notify you via email once approved</span>
              </div>
            </div>

            <button
              onClick={checkHostelStatus}
              className="mt-8 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status
  if (hostelStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Hostel Management</h1>
                <p className="text-xs text-emerald-300/60">Owner Portal</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login/owner");
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-emerald-900/20 border border-white/10 text-center">
            {/* Rejected Icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-full animate-ping opacity-10" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Application Rejected</h2>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-red-300 text-sm font-medium mb-1">Your hostel application was not approved</p>
                  <p className="text-red-300/70 text-xs leading-relaxed">
                    Unfortunately, your hostel registration application has been rejected. This could be due to incomplete information or not meeting our requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Rejection Reason — shows admin's message */}
            {hostelData?.rejection_reason && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-xs text-red-300 font-semibold uppercase tracking-wider">Admin Feedback</p>
                </div>
                <p className="text-sm text-red-200 leading-relaxed">{hostelData.rejection_reason}</p>
              </div>
            )}
            {!hostelData?.rejection_reason && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-gray-400">No specific reason provided. Please contact support for more details.</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push("/owner/register-hostel")}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Submit New Application
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  router.push("/login/owner");
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approved - Show Dashboard
  const available = rooms.filter(r => r.status === "AVAILABLE").length;
  const occupied = rooms.filter(r => r.status === "OCCUPIED").length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  const getTypeStyle = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: "bg-sky-50 text-sky-700 border-sky-200",
      DOUBLE: "bg-violet-50 text-violet-700 border-violet-200",
      TRIPLE: "bg-amber-50 text-amber-700 border-amber-200",
      DORMITORY: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[type] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      OCCUPIED: "bg-red-50 text-red-700 border-red-200",
      MAINTENANCE: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
    return map[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusDot = (status: string) => {
    const map: Record<string, string> = { AVAILABLE: "bg-emerald-500", OCCUPIED: "bg-red-500", MAINTENANCE: "bg-yellow-500" };
    return map[status] || "bg-gray-500";
  };

  const getFloorColor = (floor: number) => {
    const colors = ["from-violet-500 to-purple-600", "from-sky-500 to-blue-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600"];
    return colors[(floor - 1) % colors.length];
  };

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Welcome Banner */}
      <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-10" />
        <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Owner"}! 🏠</h1>
          <p className="text-emerald-200 mt-1 text-sm">Manage your hostel rooms and bookings here.</p>
          {hostelData?.hostel && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">{hostelData.hostel.name}</span>
              <span className="px-3 py-1 bg-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approved
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Rooms" value={rooms.length} subtitle="all rooms" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Available" value={available} subtitle="ready to book" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Occupied" value={occupied} subtitle="currently filled" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>} color="text-sky-600" bgColor="bg-sky-50" />
        <StatCard title="Total Capacity" value={`${totalCapacity} beds`} subtitle="across all rooms" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} color="text-amber-600" bgColor="bg-amber-50" />
        {bookingStats && (
          <StatCard title="Active Bookings" value={bookingStats.confirmed} subtitle={`${bookingStats.pending} pending`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} color="text-blue-600" bgColor="bg-blue-50" />
        )}
        {bookingStats && Number(bookingStats.pending_notices) > 0 && (
          <StatCard title="Pending Notices" value={bookingStats.pending_notices} subtitle="needs action" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>} color="text-amber-600" bgColor="bg-amber-50" />
        )}
      </div>

      {/* Business Management Quick Links */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Business Management</h3>
          <p className="text-xs text-gray-400 mt-0.5">Configure your hostel settings, schedule, and business plan</p>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Basic Setup", href: "/owner/business-setup", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "emerald" },
            { label: "Schedule", href: "/owner/business-setup/schedule", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "blue" },
            { label: "Amenities", href: "/owner/business-setup/amenities", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", color: "violet" },
            { label: "Business Plan", href: "/owner/business-plan", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z", color: "amber" },
            { label: "Bookings", href: "/owner/bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", color: "sky" },
          ].map((item) => (
            <a key={item.label} href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group">
              <div className={`w-10 h-10 bg-${item.color}-50 rounded-xl flex items-center justify-center group-hover:bg-${item.color}-100 transition-colors`}>
                <svg className={`w-5 h-5 text-${item.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">My Rooms</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage and monitor your hostel rooms</p>
          </div>
          <button className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add Room
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
            </div>
            <p className="text-gray-400 text-sm">No rooms yet. Add your first room!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
            {rooms.map((room) => {
              const occupancyPercent = room.capacity > 0 ? (room.current_occupancy / room.capacity) * 100 : 0;
              const isFull = room.current_occupancy >= room.capacity;
              return (
                <div key={room.id} className="rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300 group relative overflow-hidden">
                  {/* Floor badge */}
                  <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${getFloorColor(room.floor)} opacity-10 rounded-bl-3xl`} />

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {room.room_number}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Room {room.room_number}</p>
                        <p className="text-[10px] text-gray-400">Floor {room.floor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(room.status)}`} />
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyle(room.status)}`}>
                        {room.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Type</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeStyle(room.type)}`}>{room.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Occupancy</span>
                      <span className="text-xs font-semibold text-gray-700">{room.current_occupancy}/{room.capacity}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${isFull ? "bg-red-500" : occupancyPercent > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">{fc(room.price_per_month || 0)}<span className="text-[10px] text-gray-400 font-normal">/mo</span></span>
                    <button className="text-[10px] text-gray-400 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-0.5">
                      Details
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription Warning Popup */}
      {showWarningPopup && subStatusData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Subscription Alert</h3>
                  <p className="text-amber-100 text-sm">Action required for your hostel</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {subStatusData.hostels
                .filter((h) => h.subscription_status === "expiring_soon" || h.subscription_status === "grace")
                .map((h) => (
                  <div key={h.hostel_id} className="mb-4 last:mb-0">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-900 mb-1">{h.hostel_name}</p>
                      <p className="text-xs text-amber-700 mb-2">Plan: {h.plan_name}</p>
                      {h.message && <p className="text-xs text-amber-600 leading-relaxed">{h.message}</p>}
                    </div>
                  </div>
                ))}
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => { router.push("/owner/subscriptions"); setShowWarningPopup(false); }}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all"
                >
                  Renew Now
                </button>
                <button
                  onClick={() => setShowWarningPopup(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Blocked Popup */}
      {showBlockedPopup && subStatusData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Access Blocked</h3>
                  <p className="text-red-100 text-sm">Your subscription has expired</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {subStatusData.hostels
                .filter((h) => h.subscription_status === "blocked")
                .map((h) => (
                  <div key={h.hostel_id} className="mb-4 last:mb-0">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">{h.hostel_name}</p>
                      <p className="text-xs text-red-600 leading-relaxed">{h.message}</p>
                    </div>
                  </div>
                ))}
              <button
                onClick={() => { router.push("/owner/subscriptions"); setShowBlockedPopup(false); }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Renew Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Subscription Popup */}
      {showNoSubPopup && subStatusData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Subscribe Your Hostel</h3>
                  <p className="text-blue-100 text-sm">Choose a plan to get started</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-blue-700 leading-relaxed">
                  Your hostel is using the subscription model. Please subscribe to a plan to access all platform features and manage your hostel effectively.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { router.push("/owner/subscriptions"); setShowNoSubPopup(false); }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  View Plans
                </button>
                <button
                  onClick={() => setShowNoSubPopup(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
