"use client";

import { useEffect, useState, use } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

interface HostelData {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  zone_id: number;
  zone_name: string;
  logo: string | null;
  cover_photo: string | null;
  latitude: number | null;
  longitude: number | null;
  total_rooms: number;
  total_beds: number;
  minimum_stay: number;
  check_in_time: string;
  check_out_time: string;
  amenities: string[] | string;
  custom_fields: Record<string, string> | string | null;
  owner_f_name: string;
  owner_l_name: string;
  owner_phone: string;
  owner_email: string;
  status: string | number;
  rating: number;
  submitted_at: string;
  created_at: string;
}

interface Room {
  id: number;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  type: string;
  status: string;
  price_per_month: number;
  amenities: string | null;
}

interface Booking {
  id: number;
  student_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  total_amount: number;
}

interface Stats {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  total_beds: number;
  occupied_beds: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue: number;
  pending_payments: number;
  occupancy_rate: number;
}

type Tab = "overview" | "rooms" | "bookings" | "transactions";

export default function ViewHostelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hostel, setHostel] = useState<HostelData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hostelRes = await apiFetch(`/api/hostels/${id}`);
        if (hostelRes.success) {
          const data = hostelRes.data;
          // Parse amenities
          if (data.amenities && typeof data.amenities === "string") {
            try { data.amenities = JSON.parse(data.amenities); } catch { data.amenities = []; }
          }
          // Parse custom_fields
          if (data.custom_fields && typeof data.custom_fields === "string") {
            try { data.custom_fields = JSON.parse(data.custom_fields); } catch { data.custom_fields = null; }
          }
          setHostel(data);
        }

        // Fetch rooms
        try {
          const roomsRes = await apiFetch(`/api/rooms?hostel_id=${id}&limit=100`);
          if (roomsRes.success) setRooms(roomsRes.data?.rooms || roomsRes.data || []);
        } catch { /* ignore */ }

        // Fetch bookings
        try {
          const bookingsRes = await apiFetch(`/api/bookings?hostel_id=${id}&limit=20`);
          if (bookingsRes.success) setBookings(bookingsRes.data?.bookings || bookingsRes.data || []);
        } catch { /* ignore */ }

        // Calculate stats
        if (hostelRes.success) {
          const h = hostelRes.data;
          setStats({
            total_rooms: h.total_rooms || 0,
            available_rooms: rooms.filter(r => r.status === "AVAILABLE").length,
            occupied_rooms: rooms.filter(r => r.status === "OCCUPIED").length,
            total_beds: h.total_beds || 0,
            occupied_beds: rooms.reduce((sum, r) => sum + r.current_occupancy, 0),
            total_bookings: bookings.length,
            active_bookings: bookings.filter(b => b.status === "CONFIRMED").length,
            total_revenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
            pending_payments: bookings.filter(b => b.payment_status === "PENDING").length,
            occupancy_rate: h.total_beds > 0 ? Math.round((rooms.reduce((sum, r) => sum + r.current_occupancy, 0) / h.total_beds) * 100) : 0,
          });
        }
      } catch (e) {
        console.error(e);
        setMessage({ type: "error", text: "Failed to load hostel data" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!hostel) return;
    try {
      const res = await apiFetch(`/api/hostels/${hostel.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        setHostel({ ...hostel, status: newStatus });
        setMessage({ type: "success", text: `✅ Hostel ${newStatus.toLowerCase()} successfully!` });
      }
    } catch { /* ignore */ }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string | number) => {
    const s = String(status).toUpperCase();
    const styles: Record<string, string> = {
      APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      PENDING: "bg-amber-100 text-amber-700 border-amber-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
      INACTIVE: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[s] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getRoomStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: "bg-emerald-50 text-emerald-700",
      OCCUPIED: "bg-blue-50 text-blue-700",
      MAINTENANCE: "bg-amber-50 text-amber-700",
    };
    return styles[status] || "bg-gray-50 text-gray-700";
  };

  const getBookingStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      CONFIRMED: "bg-emerald-50 text-emerald-700",
      PENDING: "bg-amber-50 text-amber-700",
      CANCELLED: "bg-red-50 text-red-700",
      COMPLETED: "bg-blue-50 text-blue-700",
    };
    return styles[status] || "bg-gray-50 text-gray-700";
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading hostel details...</p>
        </div>
      </DashboardShell>
    );
  }

  if (!hostel) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Hostel not found</p>
          <button onClick={() => router.push("/admin/hostels")} className="mt-4 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all">
            Back to Hostels
          </button>
        </div>
      </DashboardShell>
    );
  }

  const isApproved = String(hostel.status).toUpperCase() === "APPROVED";

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin/hostels")} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{hostel.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(hostel.status)}`}>
              {String(hostel.status).charAt(0).toUpperCase() + String(hostel.status).slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isApproved && (
              <>
                <button onClick={() => handleStatusChange("REJECTED")}
                  className="px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
                <button onClick={() => handleStatusChange("APPROVED")}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
              </>
            )}
            <button onClick={() => router.push(`/admin/hostels/${hostel.id}/edit`)}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs (only for approved hostels) ── */}
        {isApproved && (
          <div className="mt-4 border-b border-gray-200">
            <nav className="flex gap-1 -mb-px">
              {[
                { id: "overview" as Tab, label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
                { id: "rooms" as Tab, label: "Rooms", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { id: "bookings" as Tab, label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
                { id: "transactions" as Tab, label: "Transactions", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* ── Message ── */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Cover Photo Hero ── */}
      {hostel.cover_photo && (
        <div className="mb-6 rounded-2xl overflow-hidden h-48 lg:h-56 relative">
          <img src={hostel.cover_photo} alt={hostel.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-end gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-white">
              {hostel.logo ? (
                <img src={hostel.logo} alt={hostel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xl">
                  {hostel.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">{hostel.name}</h2>
              <p className="text-white/80 text-sm">{hostel.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Statistics Cards (for approved hostels) ── */}
      {isApproved && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Rooms", value: stats.total_rooms, color: "purple", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
            { label: "Total Beds", value: stats.total_beds, color: "blue", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
            { label: "Occupancy", value: `${stats.occupancy_rate}%`, color: "emerald", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            { label: "Active Bookings", value: stats.active_bookings, color: "amber", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "Revenue", value: formatCurrency(stats.total_revenue), color: "green", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
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
      )}

      {/* ── Tab Content ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-5">
            {/* Hostel Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                {!hostel.cover_photo && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-100 shrink-0">
                    {hostel.logo ? (
                      <img src={hostel.logo} alt={hostel.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-lg">
                        {hostel.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{hostel.name}</h3>
                  <p className="text-sm text-gray-400">{hostel.address}</p>
                </div>
              </div>
              <div className="p-6">
                {hostel.description && (
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">{hostel.description}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-700">{hostel.total_rooms || 0}</p>
                    <p className="text-xs text-purple-500 mt-1 font-medium">Rooms</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-700">{hostel.total_beds || 0}</p>
                    <p className="text-xs text-blue-500 mt-1 font-medium">Beds</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-2xl font-bold text-amber-700">{hostel.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                    <p className="text-xs text-amber-500 mt-1 font-medium">Rating</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-700">{hostel.minimum_stay || 1}</p>
                    <p className="text-xs text-emerald-500 mt-1 font-medium">Min Stay (days)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Contact Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-sm font-semibold text-gray-700">{hostel.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-sm font-semibold text-gray-700">{hostel.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl sm:col-span-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="text-sm font-semibold text-gray-700">{hostel.address || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {Array.isArray(hostel.amenities) && hostel.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-base font-bold text-gray-900">Amenities</h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {hostel.amenities.map((a) => (
                      <span key={a} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium border border-purple-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {hostel.custom_fields && typeof hostel.custom_fields === "object" && Object.keys(hostel.custom_fields).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-base font-bold text-gray-900">Additional Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(hostel.custom_fields).map(([key, value]) => (
                      value && (
                        <div key={key} className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, " ")}</p>
                          <p className="text-sm font-medium text-gray-700">{String(value)}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-80 space-y-5">
            {/* Owner Info */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Owner Information</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                    {hostel.owner_f_name?.[0]?.toUpperCase() || "?"}{hostel.owner_l_name?.[0]?.toUpperCase() || ""}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{hostel.owner_f_name} {hostel.owner_l_name}</p>
                    <p className="text-xs text-gray-400">Hostel Owner</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">{hostel.owner_phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{hostel.owner_email || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Info */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Zone</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{hostel.zone_name || "—"}</p>
                    <p className="text-xs text-gray-400">Zone ID: {hostel.zone_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Schedule</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm text-gray-500">Check-in</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{hostel.check_in_time || "14:00"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm text-gray-500">Check-out</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{hostel.check_out_time || "11:00"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">Min Stay</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{hostel.minimum_stay || 1} day(s)</span>
                </div>
              </div>
            </div>

            {/* Location */}
            {hostel.latitude && hostel.longitude && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-base font-bold text-gray-900">Location</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{hostel.latitude}, {hostel.longitude}</span>
                  </div>
                  <a href={`https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-all border border-purple-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Joined */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Joined</p>
                    <p className="text-sm font-semibold text-gray-700">{formatDate(hostel.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rooms Tab ── */}
      {activeTab === "rooms" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Rooms ({rooms.length})</h3>
            <button onClick={() => router.push(`/admin/rooms?hostel_id=${id}`)}
              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-all">
              View All Rooms
            </button>
          </div>
          {rooms.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No rooms added yet</p>
              <p className="text-sm text-gray-400 mt-1">Rooms will appear here once added</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Floor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Occupancy</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.slice(0, 10).map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{room.room_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">{room.type.toLowerCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">Floor {room.floor}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{room.capacity} beds</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${room.capacity > 0 ? (room.current_occupancy / room.capacity) * 100 : 0}%` }} />
                          </div>
                          <span className="text-sm text-gray-600">{room.current_occupancy}/{room.capacity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(room.price_per_month)}/mo</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoomStatusBadge(room.status)}`}>
                          {room.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Bookings Tab ── */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Bookings ({bookings.length})</h3>
            <button onClick={() => router.push(`/admin/bookings?hostel_id=${id}`)}
              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-all">
              View All Bookings
            </button>
          </div>
          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No bookings yet</p>
              <p className="text-sm text-gray-400 mt-1">Bookings will appear here once students book rooms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check-in</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check-out</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.slice(0, 10).map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-500">#{booking.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{booking.student_name || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{booking.room_number || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(booking.check_in)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{booking.check_out ? formatDate(booking.check_out) : "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(booking.total_amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getBookingStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          booking.payment_status === "PAID" ? "bg-emerald-50 text-emerald-700" :
                          booking.payment_status === "OVERDUE" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-base font-bold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Payment transactions will appear here</p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
