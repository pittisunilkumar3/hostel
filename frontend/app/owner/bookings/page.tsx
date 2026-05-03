"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Booking {
  id: number;
  booking_type: string;
  duration: number;
  guests: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  total_amount: number;
  unit_price: number;
  sub_total: number;
  tax_amount: number;
  advance_amount: string;
  advance_status: string;
  billing_start_date: string;
  next_bill_date: string;
  billing_cycle: number;
  notice_status: string;
  notice_given_at: string;
  notice_vacate_date: string;
  created_at: string;
  hostel_name: string;
  hostel_logo: string;
  notice_period_days: number;
  room_number: string;
  room_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
}

export default function OwnerBookingsPage() {
  const { fc } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [noticeFilter, setNoticeFilter] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const statusParam = filter !== "all" ? `&status=${filter}` : "";
      const noticeParam = noticeFilter ? "&notice=pending" : "";
      const res = await fetch(`${API_URL}/api/owner/bookings?limit=100${statusParam}${noticeParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data.bookings || []);
        setStats(data.data.stats || null);
      }
    } catch {}
    setLoading(false);
  }, [user, filter, noticeFilter]);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u || u.role !== "OWNER") return;
      setUser(u);
    });
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleBookingAction = async (bookingId: number, action: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
      } else {
        alert(data.message || "Failed");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleNoticeAction = async (bookingId: number, action: "approve" | "reject") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/bookings/notice/manage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ booking_id: bookingId, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
      } else {
        alert(data.message || "Failed");
      }
    } catch {
      alert("Network error");
    }
  };

  if (!user) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </DashboardShell>
    );
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "CONFIRMED": return "bg-emerald-100 text-emerald-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const noticeColor = (s: string) => {
    switch (s) {
      case "PENDING": return "bg-amber-100 text-amber-700 ring-1 ring-amber-300";
      case "APPROVED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage bookings, notices, and billing for your hostels</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total", value: stats.total_bookings, color: "bg-gray-50 border-gray-200" },
              { label: "Confirmed", value: stats.confirmed, color: "bg-emerald-50 border-emerald-200" },
              { label: "Pending", value: stats.pending, color: "bg-yellow-50 border-yellow-200" },
              { label: "Completed", value: stats.completed, color: "bg-blue-50 border-blue-200" },
              { label: "Cancelled", value: stats.cancelled, color: "bg-red-50 border-red-200" },
              { label: "Notices", value: stats.pending_notices, color: "bg-amber-50 border-amber-200" },
              { label: "Revenue", value: fc(stats.total_revenue), color: "bg-violet-50 border-violet-200" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} border rounded-xl p-3 text-center`}>
                <div className="text-xl font-bold text-gray-800">{s.value}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setNoticeFilter(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f && !noticeFilter
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All Bookings" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
          <button
            onClick={() => { setNoticeFilter(!noticeFilter); setFilter("all"); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              noticeFilter
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            Pending Notices {stats?.pending_notices > 0 && <span className="bg-white text-amber-600 rounded-full px-1.5 text-xs font-bold">{stats.pending_notices}</span>}
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-gray-400 mt-4">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Main Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  {/* Left: Room & Hostel */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">#{b.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor(b.status)}`}>{b.status}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        b.payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                        b.payment_status === "OVERDUE" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{b.payment_status}</span>
                      {b.notice_status && b.notice_status !== "NONE" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${noticeColor(b.notice_status)}`}>
                          Notice: {b.notice_status}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">{b.hostel_name}</span> • Room <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{b.room_number}</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="text-gray-500 capitalize">{b.booking_type}</span>
                      <span className="text-gray-400 mx-0.5">×{b.duration}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {b.customer_name || b.guest_name} {b.customer_phone || b.guest_phone ? `• ${b.customer_phone || b.guest_phone}` : ""}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{fc(b.total_amount)}</div>
                      {Number(b.advance_amount) > 0 && (
                        <div className="text-[10px] text-gray-400">Advance: {fc(Number(b.advance_amount))} ({b.advance_status})</div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <svg className={`w-5 h-5 text-gray-400 transition ${expandedBooking === b.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedBooking === b.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">Check-in</div>
                        <div className="text-sm text-gray-800 mt-0.5">{b.check_in ? new Date(b.check_in).toLocaleDateString() : "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">Check-out</div>
                        <div className="text-sm text-gray-800 mt-0.5">{b.check_out ? new Date(b.check_out).toLocaleDateString() : "Open"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">Billing Cycle</div>
                        <div className="text-sm text-gray-800 mt-0.5">#{b.billing_cycle || 1}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">Next Bill</div>
                        <div className="text-sm mt-0.5">
                          {b.next_bill_date ? (
                            <span className={new Date(b.next_bill_date) < new Date() ? "text-red-600 font-medium" : "text-gray-800"}>
                              {new Date(b.next_bill_date).toLocaleDateString()}
                            </span>
                          ) : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="text-xs font-bold text-gray-700 mb-2">Price Breakdown</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fc(b.sub_total)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{fc(b.tax_amount)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total</span><span>{fc(b.total_amount)}</span></div>
                        {Number(b.advance_amount) > 0 && (
                          <div className="flex justify-between text-amber-600"><span>Advance Deposit</span><span>{fc(Number(b.advance_amount))}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Notice Section */}
                    {b.notice_status && b.notice_status !== "NONE" && (
                      <div className={`rounded-xl p-3 border ${
                        b.notice_status === "PENDING" ? "bg-amber-50 border-amber-200" :
                        b.notice_status === "APPROVED" ? "bg-green-50 border-green-200" :
                        "bg-red-50 border-red-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-gray-800">
                              Notice to Vacate — {b.notice_status}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Given: {b.notice_given_at ? new Date(b.notice_given_at).toLocaleDateString() : "—"} •
                              Vacate by: {b.notice_vacate_date ? new Date(b.notice_vacate_date).toLocaleDateString() : "—"} •
                              Notice period: {b.notice_period_days} days
                            </div>
                          </div>
                          {b.notice_status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleNoticeAction(b.id, "reject")}
                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleNoticeAction(b.id, "approve")}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {b.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleBookingAction(b.id, "CONFIRMED")}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                          >
                            ✓ Confirm Booking
                          </button>
                          <button
                            onClick={() => { if (confirm("Cancel this booking?")) handleBookingAction(b.id, "CANCELLED"); }}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => { if (confirm("Mark as completed?")) handleBookingAction(b.id, "COMPLETED"); }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          ✓ Mark Completed
                        </button>
                      )}
                    </div>

                    {/* Created date */}
                    <div className="text-[10px] text-gray-400">Created: {new Date(b.created_at).toLocaleString()}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
