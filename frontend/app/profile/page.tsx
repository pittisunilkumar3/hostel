"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import PublicHeader from "@/app/components/PublicHeader";
import PublicFooter from "@/app/components/PublicFooter";
import { API_URL } from "@/lib/auth";
import { useCurrency } from "@/lib/useCurrency";

interface UserData { id: number; name: string; email: string; role: string; phone?: string; avatar?: string; }
interface Booking {
  id: number; booking_type: string; duration: number; guests: number;
  guest_name: string; guest_phone: string;
  check_in: string; check_out: string; status: string; payment_status: string;
  total_amount: number; unit_price: number; sub_total: number; tax_amount: number;
  advance_amount?: number; advance_status?: string;
  hostel_name: string; hostel_address: string; hostel_phone: string; hostel_logo: string;
  room_number: string; room_type: string; pricing_type: string;
  price_per_hour: number; price_per_day: number; price_per_month: number;
  zone_name: string;
  special_requests: string;
}
interface Conversation { id: number; chat_type: string; hostel_name: string; owner_name: string; last_message: string; unread_count: number; updated_at: string; hostel_id: number; owner_id: number; }
interface ChatMessage { id: number; sender_id: number; sender_type: string; message: string; is_read: number; created_at: string; sender_name: string; }

export default function UserProfilePage() {
  const router = useRouter();
  const { fc, symbol } = useCurrency();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [avatar, setAvatar] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });

  // Booking state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilter, setBookingFilter] = useState("active");
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active hostel (for floating button)
  const [activeHostel, setActiveHostel] = useState<{ hostel_id: number; hostel_name: string; owner_id: number; owner_name: string } | null>(null);

  // Floating support
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login/user"); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role !== "CUSTOMER") { router.push("/"); return; }
      setUser(u);
      setForm({ name: u.name || "", email: u.email || "", phone: u.phone || "" });
      setAvatar(u.avatar || "");
    } catch { router.push("/login/user"); }
  }, [router]);

  // Fetch bookings
  const fetchBookings = useCallback(async (filter: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setBookingsLoading(true);
    try {
      const statusParam = filter === "active" ? "&status=active" : filter === "completed" ? "&status=COMPLETED" : filter === "cancelled" ? "&status=CANCELLED" : "";
      const res = await fetch(`${API_URL}/api/bookings/my?limit=50${statusParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data.bookings || []);
        // Check for active hostel (confirmed booking)
        const active = (data.data.bookings || []).find((b: Booking) => b.status === "CONFIRMED" || b.status === "PENDING");
        if (active) {
          setActiveHostel({ hostel_id: active.hostel_id || 0, hostel_name: active.hostel_name, owner_id: active.hostel_owner_id || 0, owner_name: "" });
        } else {
          setActiveHostel(null);
        }
      }
    } catch {}
    setBookingsLoading(false);
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/support/conversations?type=all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setConversations(data.data || []);
    } catch {}
  }, []);

  // Load chat messages for a conversation
  const loadChatMessages = async (conv: Conversation) => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;
    setActiveConversation(conv);
    setChatLoading(true);
    try {
      const chatWith = conv.chat_type === "admin" ? "admin" : "owner";
      let url = `${API_URL}/api/support/chat?userId=${user.id}&chatWith=${chatWith}`;
      if (conv.hostel_id) url += `&hostelId=${conv.hostel_id}`;
      if (conv.owner_id) url += `&ownerId=${conv.owner_id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data.messages || []);
        // Mark as read
        if (data.data.conversation?.id) {
          fetch(`${API_URL}/api/support/chat`, {
            method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ conversationId: data.data.conversation.id }),
          }).catch(() => {});
        }
      }
    } catch {}
    setChatLoading(false);
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatInput.trim() || !activeConversation || !user) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const msg = chatInput.trim();
    setChatInput("");
    try {
      await fetch(`${API_URL}/api/support/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          senderId: user.id,
          senderType: "user",
          message: msg,
        }),
      });
      // Reload messages
      loadChatMessages(activeConversation);
      fetchConversations();
    } catch {}
  };

  // Load data when tab changes
  useEffect(() => {
    if (!user) return;
    if (activeTab === "bookings") fetchBookings(bookingFilter);
    if (activeTab === "messages") { fetchConversations(); }
  }, [activeTab, user, bookingFilter, fetchBookings, fetchConversations]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Fetch active hostel for floating button
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/bookings/my?limit=5&status=active`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.bookings?.length > 0) {
          const b = data.data.bookings[0];
          setActiveHostel({ hostel_id: b.hostel_id, hostel_name: b.hostel_name, owner_id: b.hostel_owner_id || 0, owner_name: "" });
        }
      }).catch(() => {});
  }, [user]);

  // Profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...user, ...form };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated as UserData);
        setMessage({ type: "success", text: "Profile updated!" });
      } else { setMessage({ type: "error", text: data.message || "Failed" }); }
    } catch { setMessage({ type: "error", text: "Network error" }); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/"); };

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>;

  const statusColor: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-emerald-100 text-emerald-700", COMPLETED: "bg-blue-100 text-blue-700", CANCELLED: "bg-red-100 text-red-700" };
  const payColor: Record<string, string> = { PENDING: "bg-orange-100 text-orange-700", PAID: "bg-green-100 text-green-700", OVERDUE: "bg-red-100 text-red-700" };

  const sidebarItems = [
    { key: "bookings", label: "My Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { key: "profile", label: "Profile Settings", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { key: "wallet", label: "My Wallet", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { key: "messages", label: "Messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="bg-white border-b border-gray-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <a href="/" className="text-gray-500 hover:text-emerald-600">Home</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">My Account</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 mx-auto mb-3">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3 className="text-white font-bold text-lg">{user.name}</h3>
                <p className="text-emerald-100 text-sm">{user.email}</p>
                {user.phone && <p className="text-emerald-200 text-xs mt-1">{user.phone}</p>}
              </div>
              <nav className="p-3">
                {sidebarItems.map((item) => (
                  <button key={item.key} onClick={() => { setActiveTab(item.key); setMessage(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.key ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    <svg className={`w-5 h-5 ${activeTab === item.key ? "text-emerald-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {message && (
              <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
            )}

            {/* ===== BOOKINGS TAB ===== */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                {/* Active Hostel Card */}
                {activeHostel && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-white/20 text-xs font-bold rounded-full">CURRENT STAY</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{activeHostel.hostel_name}</h2>
                      <p className="text-emerald-100 text-sm">You have an active booking at this hostel</p>
                      <div className="flex gap-3 mt-4">
                        <button onClick={async () => {
                          setActiveTab("messages");
                          if (user && activeHostel?.owner_id) {
                            const token = localStorage.getItem("token");
                            try {
                              const res = await fetch(`${API_URL}/api/support/chat?userId=${user.id}&chatWith=owner&hostelId=${activeHostel.hostel_id}&ownerId=${activeHostel.owner_id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              const data = await res.json();
                              if (data.success) {
                                const conv = data.data.conversation;
                                setActiveConversation({ ...conv, chat_type: "owner", hostel_name: activeHostel.hostel_name, owner_name: "" });
                                setChatMessages(data.data.messages || []);
                                fetchConversations();
                              }
                            } catch {}
                          }
                        }} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          Chat with Owner
                        </button>
                        <a href={`tel:${bookings.find(b => b.status === 'CONFIRMED')?.hostel_phone}`} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Call
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">My Bookings</h2>
                    <div className="flex gap-2 mt-3">
                      {[{ key: "active", label: "Active" }, { key: "completed", label: "Completed" }, { key: "cancelled", label: "Cancelled" }, { key: "all", label: "All" }].map(f => (
                        <button key={f.key} onClick={() => setBookingFilter(f.key)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${bookingFilter === f.key ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    {bookingsLoading ? (
                      <div className="flex justify-center py-10"><div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Bookings Found</h3>
                        <p className="text-gray-500 text-sm mb-4">No {bookingFilter !== "all" ? bookingFilter : ""} bookings to show</p>
                        <a href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 inline-block">Browse Hostels</a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map(b => (
                          <div key={b.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-bold text-gray-900 text-lg truncate">{b.hostel_name}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[b.status] || "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${payColor[b.payment_status] || "bg-gray-100 text-gray-600"}`}>{b.payment_status}</span>
                                  </div>
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                    {b.hostel_address}{b.zone_name ? ` • ${b.zone_name}` : ""}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">🛏️ Room {b.room_number} ({b.room_type})</span>
                                    <span className="capitalize">📋 {b.pricing_type}</span>
                                    <span>⏱ {b.duration} {b.booking_type === "hourly" ? "hr(s)" : b.booking_type === "daily" ? "day(s)" : "month(s)"}</span>
                                    <span>👥 {b.guests} guest{b.guests > 1 ? "s" : ""}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xl font-bold text-emerald-700">{fc(b.total_amount)}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">Booking #{b.id}</div>
                                </div>
                              </div>

                              {/* Date row */}
                              <div className="flex items-center gap-6 mt-3 text-sm">
                                <div><span className="text-gray-400">Check-in:</span> <span className="font-medium text-gray-700">{new Date(b.check_in).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                                {b.check_out && <div><span className="text-gray-400">Check-out:</span> <span className="font-medium text-gray-700">{new Date(b.check_out).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>}
                              </div>

                              {/* Expand toggle */}
                              <button onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)} className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                                {expandedBooking === b.id ? "▲ Hide details" : "▼ View details"}
                              </button>
                            </div>

                            {/* Expanded details */}
                            {expandedBooking === b.id && (
                              <div className="border-t border-gray-100 bg-gray-50 p-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div><span className="text-gray-400 block text-xs">Unit Price</span><span className="font-medium">{fc(b.unit_price)}</span></div>
                                  <div><span className="text-gray-400 block text-xs">Sub Total</span><span className="font-medium">{fc(b.sub_total)}</span></div>
                                  <div><span className="text-gray-400 block text-xs">Tax</span><span className="font-medium">{fc(b.tax_amount)}</span></div>
                                  <div><span className="text-gray-400 block text-xs">Total Paid</span><span className="font-bold text-emerald-700">{fc(b.total_amount)}</span></div>
                                  {b.advance_amount > 0 && (
                                    <div><span className="text-gray-400 block text-xs">Advance Deposit</span><span className="font-bold text-amber-700">{fc(b.advance_amount)}</span>
                                      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        b.advance_status === 'PAID' ? 'bg-green-100 text-green-700' :
                                        b.advance_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                                        b.advance_status === 'REFUNDED' ? 'bg-blue-100 text-blue-700' :
                                        b.advance_status === 'ADJUSTED' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>{b.advance_status || 'UNPAID'}</span>
                                    </div>
                                  )}
                                </div>
                                {b.special_requests && (
                                  <div className="mt-3 text-sm"><span className="text-gray-400">Special Requests:</span> {b.special_requests}</div>
                                )}
                                <div className="mt-3 text-xs text-gray-400">Booked on {new Date(b.check_in).toLocaleString()}</div>
                                {b.hostel_phone && (
                                  <a href={`tel:${b.hostel_phone}`} className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    Call {b.hostel_name}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Profile Settings</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Update your personal details and password</p>
                </div>
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" value={form.email} disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" /></div>
                  </div>
                  <div className="flex justify-end"><button type="submit" disabled={loading} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50">{loading ? "Saving..." : "Save Changes"}</button></div>
                </form>
              </div>
            )}

            {/* ===== WALLET TAB ===== */}
            {activeTab === "wallet" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">My Wallet</h2></div>
                <div className="p-6">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-6">
                    <p className="text-emerald-100 text-sm mb-1">Available Balance</p>
                    <p className="text-3xl font-bold">{fc(0)}</p>
                    <p className="text-emerald-200 text-xs mt-2">Loyalty Points: 0</p>
                  </div>
                  <div className="text-center py-8 text-gray-400 text-sm">No transactions yet</div>
                </div>
              </div>
            )}

            {/* ===== MESSAGES TAB ===== */}
            {activeTab === "messages" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex h-[600px]">
                  {/* Conversations sidebar */}
                  <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">Messages</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">No conversations yet.<br />Use the support button to start a chat!</div>
                      ) : (
                        conversations.map(c => (
                          <button key={c.id} onClick={() => loadChatMessages(c)}
                            className={`w-full text-left p-4 border-b border-gray-50 hover:bg-emerald-50 transition ${activeConversation?.id === c.id ? "bg-emerald-50 border-l-4 border-l-emerald-600" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${c.chat_type === "admin" ? "bg-emerald-500" : "bg-blue-500"}`}>
                                {c.chat_type === "admin" ? "S" : c.hostel_name?.charAt(0) || "O"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-900 truncate">
                                  {c.chat_type === "admin" ? "Support Team" : c.hostel_name || "Hostel Owner"}
                                </div>
                                <div className="text-xs text-gray-400 truncate">{c.last_message || "No messages yet"}</div>
                              </div>
                              {c.unread_count > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unread_count}</span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="flex-1 flex flex-col">
                    {activeConversation ? (
                      <>
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${activeConversation.chat_type === "admin" ? "bg-emerald-500" : "bg-blue-500"}`}>
                            {activeConversation.chat_type === "admin" ? "S" : activeConversation.hostel_name?.charAt(0) || "O"}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{activeConversation.chat_type === "admin" ? "Support Team" : activeConversation.hostel_name || "Hostel Owner"}</div>
                            <div className="text-xs text-gray-400">{activeConversation.chat_type === "admin" ? "Platform support" : "Hostel owner"}</div>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {chatLoading ? (
                            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                          ) : chatMessages.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm py-10">No messages yet. Say hi!</div>
                          ) : (
                            chatMessages.map(m => (
                              <div key={m.id} className={`flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_type === "user" ? "bg-emerald-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                                  <p>{m.message}</p>
                                  <p className={`text-[10px] mt-1 ${m.sender_type === "user" ? "text-emerald-200" : "text-gray-400"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-100">
                          <div className="flex gap-2">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                              placeholder="Type a message..." className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                            <button onClick={sendMessage} disabled={!chatInput.trim()} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          <p>Select a conversation to start chatting</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== FLOATING SUPPORT BUTTON ===== */}
      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          {showSupport && (
            <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                <h4 className="font-bold text-sm">Need Help?</h4>
                <p className="text-emerald-100 text-xs">Choose who to chat with</p>
              </div>
              <div className="p-3 space-y-2">
                {/* Always show Support tab */}
                <button onClick={() => { setActiveTab("messages"); setShowSupport(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 transition text-left">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Support Team</div>
                    <div className="text-xs text-gray-400">Platform support</div>
                  </div>
                </button>

                {/* Show hostel owner tab only if user has active booking */}
                {activeHostel && activeHostel.owner_id > 0 && (
                  <button onClick={async () => {
                    setActiveTab("messages");
                    setShowSupport(false);
                    // Auto-create/open conversation with owner
                    if (user) {
                      const token = localStorage.getItem("token");
                      try {
                        const res = await fetch(`${API_URL}/api/support/chat?userId=${user.id}&chatWith=owner&hostelId=${activeHostel.hostel_id}&ownerId=${activeHostel.owner_id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.success) {
                          const conv = data.data.conversation;
                          setActiveConversation({ ...conv, chat_type: "owner", hostel_name: activeHostel.hostel_name, owner_name: "" });
                          setChatMessages(data.data.messages || []);
                          fetchConversations();
                        }
                      } catch {}
                    }
                  }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition text-left">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{activeHostel.hostel_name}</div>
                      <div className="text-xs text-gray-400">Chat with hostel owner</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
          <button onClick={() => setShowSupport(!showSupport)}
            className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center hover:scale-110 transition-transform">
            {showSupport ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            )}
          </button>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
