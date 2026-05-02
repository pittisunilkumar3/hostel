"use client";

import { useEffect, useState, use } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";
import LeafletMap from "@/app/components/LeafletMap";
import { useCurrency } from "@/lib/useCurrency";

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
  business_model: string;
  commission_rate: number;
  commission_on_delivery: number;
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

type Tab = "overview" | "rooms" | "bookings" | "transactions" | "reviews" | "discount" | "conversations" | "business" | "subscription" | "meta" | "qrcode";

// ── Conversation interfaces ──
interface ConvMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: "user" | "admin" | "owner";
  message: string;
  is_read: number;
  created_at: string;
  sender_name: string;
}
interface Conversation {
  id: number;
  user_id: number;
  hostel_id: number;
  last_message: string | null;
  unread_count: number;
  status: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_avatar: string | null;
}

// ── Business Settings ──
interface BusinessSetting {
  id: number;
  hostel_id: number;
  key: string;
  value: string | null;
}
interface BusinessSchema {
  key: string;
  label: string;
  default: string;
  type: string;
  options?: string[];
}

// ── Meta Data ──
interface MetaData {
  meta_title: string | null;
  meta_description: string | null;
  meta_image: string | null;
  meta_index: string;
  meta_no_follow: number;
  meta_no_image_index: number;
  meta_no_archive: number;
  meta_no_snippet: number;
  meta_max_snippet: number | null;
  meta_max_video_preview: number | null;
  meta_max_image_preview: string | null;
}

// ── QR Code ──
interface QRData {
  qr_title: string | null;
  qr_description: string | null;
  qr_phone: string | null;
  qr_website: string | null;
  qr_code_data: string | null;
}

// ── Reviews ──
interface Review {
  id: number;
  hostel_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  reply: string | null;
  status: number;
  created_at: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
}
interface ReviewStats {
  total_reviews: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

// ── Discount ──
interface Discount {
  id: number;
  hostel_id: number;
  discount: string;
  min_purchase: string;
  max_discount: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: number;
}

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

  // ── Conversations state ──
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // ── Business Settings state ──
  const [businessSettings, setBusinessSettings] = useState<BusinessSetting[]>([]);
  const [businessSchema, setBusinessSchema] = useState<BusinessSchema[]>([]);
  const [businessForm, setBusinessForm] = useState<Record<string, string>>({});
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [editCommissionModel, setEditCommissionModel] = useState("commission");
  const [editCommissionRate, setEditCommissionRate] = useState("12");
  const [savingCommission, setSavingCommission] = useState(false);

  // ── Meta Data state ──
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [metaForm, setMetaForm] = useState<Record<string, any>>({});
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaImagePreview, setMetaImagePreview] = useState("");

  // ── QR Code state ──
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [qrForm, setQRForm] = useState<Record<string, string>>({});
  const [savingQR, setSavingQR] = useState(false);

  // ── Reviews state ──
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // ── Discount state ──
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState({
    discount: "",
    min_purchase: "",
    max_discount: "",
    start_date: "",
    end_date: "",
    start_time: "00:00",
    end_time: "23:59",
  });
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);

  // ── Subscription state ──
  const [hostelSubData, setHostelSubData] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [subLoading, setSubLoading] = useState(false);
  const [subAction, setSubAction] = useState<string | null>(null);



  // ── Fetch feature data when tab changes ──
  useEffect(() => {
    if (!id) return;
    if (activeTab === "conversations") fetchConversations();
    if (activeTab === "business") fetchBusinessSettings();
    if (activeTab === "meta") fetchMetaData();
    if (activeTab === "qrcode") fetchQRData();
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "discount") fetchDiscount();
    if (activeTab === "subscription") { fetchHostelSubscription(); fetchAvailablePlans(); }
  }, [activeTab, id]);

  // ── Subscription API ──
  const fetchHostelSubscription = async () => {
    try {
      setSubLoading(true);
      const res = await apiFetch(`/api/admin/subscriptions/hostel/${id}`);
      if (res.success) {
        setHostelSubData(res.data);
        // Update local hostel state
        if (res.data.hostel) {
          setHostel(prev => prev ? { ...prev, business_model: res.data.hostel.business_model, commission_rate: res.data.hostel.commission_rate } : null);
          setEditCommissionModel(res.data.hostel.business_model || "commission");
          setEditCommissionRate((res.data.hostel.commission_rate || 12).toString());
        }
      }
    } catch (e) { console.error(e); }
    finally { setSubLoading(false); }
  };

  const fetchAvailablePlans = async () => {
    try {
      const res = await apiFetch("/api/admin/subscriptions/plans?status=active");
      if (res.success) setAvailablePlans(res.data || []);
    } catch (e) { console.error(e); }
  };

  const handleSubscriptionAction = async (action: string, extraData: any = {}) => {
    try {
      setSubAction(action);
      const res = await apiFetch(`/api/admin/subscriptions/hostel/${id}`, {
        method: "POST",
        body: JSON.stringify({ action, ...extraData }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${res.message || "Action completed"}` });
        fetchHostelSubscription();
      } else {
        setMessage({ type: "error", text: res.message || "Action failed" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Action failed" });
    } finally { setSubAction(null); }
  };



  // ── Reviews API ──
  const fetchReviews = async (page = 1) => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/reviews?page=${page}&limit=10`);
      if (res.success) {
        setReviews(res.data.reviews || []);
        setReviewStats(res.data.stats || null);
        setReviewPage(res.data.pagination?.page || 1);
        setReviewTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (e) { console.error(e); }
  };
  const submitReply = async (reviewId: number) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    try {
      const res = await apiFetch(`/api/hostels/${id}/reviews`, {
        method: "PUT",
        body: JSON.stringify({ reviewId, action: "reply", reply: text.trim() }),
      });
      if (res.success) {
        setReplyText({ ...replyText, [reviewId]: "" });
        setReplyingTo(null);
        fetchReviews(reviewPage);
      }
    } catch (e) { console.error(e); }
  };
  const toggleReviewVisibility = async (reviewId: number, currentStatus: number) => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/reviews`, {
        method: "PUT",
        body: JSON.stringify({ reviewId, action: "toggle_status", status: currentStatus ? 0 : 1 }),
      });
      if (res.success) fetchReviews(reviewPage);
    } catch (e) { console.error(e); }
  };

  // ── Discount API ──
  const fetchDiscount = async () => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/discount`);
      if (res.success && res.data) {
        setDiscount(res.data);
        const d = res.data;
        setDiscountForm({
          discount: d.discount || "",
          min_purchase: d.min_purchase || "",
          max_discount: d.max_discount || "",
          start_date: d.start_date ? d.start_date.split("T")[0] : "",
          end_date: d.end_date ? d.end_date.split("T")[0] : "",
          start_time: d.start_time ? d.start_time.substring(0, 5) : "00:00",
          end_time: d.end_time ? d.end_time.substring(0, 5) : "23:59",
        });
      } else {
        setDiscount(null);
      }
    } catch (e) { console.error(e); }
  };
  const saveDiscount = async () => {
    setSavingDiscount(true);
    try {
      const res = await apiFetch(`/api/hostels/${id}/discount`, {
        method: "POST",
        body: JSON.stringify(discountForm),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ Discount ${res.data?.action || "saved"} successfully!` });
        setShowDiscountModal(false);
        fetchDiscount();
      }
    } catch { setMessage({ type: "error", text: "Failed to save discount" }); }
    finally { setSavingDiscount(false); }
  };
  const deleteDiscount = async () => {
    if (!confirm("Are you sure you want to remove this discount?")) return;
    try {
      const res = await apiFetch(`/api/hostels/${id}/discount`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Discount removed!" });
        setDiscount(null);
        setDiscountForm({ discount: "", min_purchase: "", max_discount: "", start_date: "", end_date: "", start_time: "00:00", end_time: "23:59" });
      }
    } catch { setMessage({ type: "error", text: "Failed to delete discount" }); }
  };

  // ── Conversations API ──
  const fetchConversations = async (search = "") => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/hostels/${id}/conversations?${params}`);
      if (res.success) {
        const payload = res.data;
        if (payload?.data) setConversations(payload.data);
        else if (Array.isArray(payload)) setConversations(payload);
        else setConversations([]);
      }
    } catch (e) { console.error(e); }
  };
  const fetchConvMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/conversations/${convId}`);
      if (res.success) {
        const payload = res.data;
        if (Array.isArray(payload)) setConvMessages(payload);
        else if (payload?.data) setConvMessages(payload.data);
        else setConvMessages([]);
      }
    } catch (e) { console.error(e); }
  };
  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    await fetchConvMessages(conv.id);
    fetchConversations(convSearch);
  };
  const sendConvMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await apiFetch(`/api/hostels/${id}/conversations`, {
        method: "POST",
        body: JSON.stringify({ conversationId: selectedConv.id, senderId: 1, message: newMessage.trim() }),
      });
      if (res.success) {
        setNewMessage("");
        fetchConvMessages(selectedConv.id);
        fetchConversations(convSearch);
      }
    } catch (e) { console.error(e); }
    finally { setSendingMessage(false); }
  };

  // ── Business Settings API ──
  const fetchBusinessSettings = async () => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/business-settings`);
      if (res.success) {
        const { settings, schema } = res.data;
        setBusinessSettings(settings || []);
        setBusinessSchema(schema || []);
        const form: Record<string, string> = {};
        (settings || []).forEach((s: BusinessSetting) => { form[s.key] = s.value || ""; });
        setBusinessForm(form);
      }
    } catch (e) { console.error(e); }
  };
  const saveBusinessSettings = async () => {
    setSavingBusiness(true);
    try {
      const res = await apiFetch(`/api/hostels/${id}/business-settings`, {
        method: "PUT",
        body: JSON.stringify(businessForm),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Business settings saved!" });
        fetchBusinessSettings();
      }
    } catch { setMessage({ type: "error", text: "Failed to save" }); }
    finally { setSavingBusiness(false); }
  };

  const saveCommissionSettings = async () => {
    setSavingCommission(true);
    try {
      const res = await apiFetch(`/api/hostels/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          business_model: editCommissionModel,
          commission_rate: parseFloat(editCommissionRate) || 12,
        }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Commission settings saved!" });
        // Update local hostel state
        setHostel(prev => prev ? {
          ...prev,
          business_model: editCommissionModel,
          commission_rate: parseFloat(editCommissionRate) || 12,
        } : null);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save" });
      }
    } catch { setMessage({ type: "error", text: "Failed to save commission settings" }); }
    finally { setSavingCommission(false); }
  };

  // ── Meta Data API ──
  const fetchMetaData = async () => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/meta-data`);
      if (res.success && res.data) {
        setMetaData(res.data);
        setMetaForm({
          meta_title: res.data.meta_title || "",
          meta_description: res.data.meta_description || "",
          meta_image: res.data.meta_image || "",
          meta_index: res.data.meta_index || "index",
          meta_no_follow: res.data.meta_no_follow ? "1" : "0",
          meta_no_image_index: res.data.meta_no_image_index ? "1" : "0",
          meta_no_archive: res.data.meta_no_archive ? "1" : "0",
          meta_no_snippet: res.data.meta_no_snippet ? "1" : "0",
          meta_max_snippet: res.data.meta_max_snippet?.toString() || "",
          meta_max_video_preview: res.data.meta_max_video_preview?.toString() || "",
          meta_max_image_preview: res.data.meta_max_image_preview || "large",
        });
        setMetaImagePreview(res.data.meta_image || "");
      }
    } catch (e) { console.error(e); }
  };
  const saveMetaData = async () => {
    setSavingMeta(true);
    try {
      const payload = { ...metaForm };
      payload.meta_no_follow = payload.meta_no_follow === "1" ? 1 : 0;
      payload.meta_no_image_index = payload.meta_no_image_index === "1" ? 1 : 0;
      payload.meta_no_archive = payload.meta_no_archive === "1" ? 1 : 0;
      payload.meta_no_snippet = payload.meta_no_snippet === "1" ? 1 : 0;
      payload.meta_max_snippet = payload.meta_max_snippet ? parseInt(payload.meta_max_snippet) : null;
      payload.meta_max_video_preview = payload.meta_max_video_preview ? parseInt(payload.meta_max_video_preview) : null;
      const res = await apiFetch(`/api/hostels/${id}/meta-data`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Meta data saved!" });
        fetchMetaData();
      }
    } catch { setMessage({ type: "error", text: "Failed to save" }); }
    finally { setSavingMeta(false); }
  };
  const handleMetaImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setMetaForm({ ...metaForm, meta_image: result });
      setMetaImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // ── QR Code API ──
  const fetchQRData = async () => {
    try {
      const res = await apiFetch(`/api/hostels/${id}/qr-code`);
      if (res.success && res.data) {
        setQRData(res.data);
        setQRForm({
          qr_title: res.data.qr_title || "",
          qr_description: res.data.qr_description || "",
          qr_phone: res.data.qr_phone || hostel?.phone || "",
          qr_website: res.data.qr_website || "",
        });
      } else {
        setQRForm({
          qr_title: `View ${hostel?.name || "Hostel"} Rooms`,
          qr_description: "Check our rooms online, just open your phone & scan this QR Code",
          qr_phone: hostel?.phone || "",
          qr_website: "",
        });
      }
    } catch (e) { console.error(e); }
  };
  const saveQRData = async () => {
    setSavingQR(true);
    try {
      const qrUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/hostel/${id}`;
      const payload = { ...qrForm, qr_code_data: qrUrl };
      const res = await apiFetch(`/api/hostels/${id}/qr-code`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ QR code saved!" });
        fetchQRData();
      }
    } catch { setMessage({ type: "error", text: "Failed to save" }); }
    finally { setSavingQR(false); }
  };

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
          // Initialize commission edit fields
          setEditCommissionModel(data.business_model || "commission");
          setEditCommissionRate((data.commission_rate || 12).toString());
        }

        // Fetch rooms
        let fetchedRooms: any[] = [];
        try {
          const roomsRes = await apiFetch(`/api/rooms?hostel_id=${id}&limit=100`);
          if (roomsRes.success) { fetchedRooms = roomsRes.data?.rooms || roomsRes.data || []; setRooms(fetchedRooms); }
        } catch { /* ignore */ }

        // Fetch bookings
        let fetchedBookings: any[] = [];
        try {
          const bookingsRes = await apiFetch(`/api/bookings?hostel_id=${id}&limit=20`);
          if (bookingsRes.success) { fetchedBookings = bookingsRes.data?.bookings || bookingsRes.data || []; setBookings(fetchedBookings); }
        } catch { /* ignore */ }

        // Calculate stats using fetched data directly (not stale state)
        if (hostelRes.success) {
          const h = hostelRes.data;
          setStats({
            total_rooms: fetchedRooms.length || h.total_rooms || 0,
            available_rooms: fetchedRooms.filter(r => r.status === "AVAILABLE").length,
            occupied_rooms: fetchedRooms.filter(r => r.status === "OCCUPIED").length,
            total_beds: h.total_beds || fetchedRooms.reduce((sum: number, r: any) => sum + (r.capacity || 0), 0),
            occupied_beds: fetchedRooms.reduce((sum: number, r: any) => sum + (r.current_occupancy || 0), 0),
            total_bookings: fetchedBookings.length,
            active_bookings: fetchedBookings.filter((b: any) => b.status === "CONFIRMED" || b.status === "PENDING").length,
            total_revenue: fetchedBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
            pending_payments: fetchedBookings.filter((b: any) => b.payment_status === "PENDING").length,
            occupancy_rate: (h.total_beds || 0) > 0 ? Math.round((fetchedRooms.reduce((sum: number, r: any) => sum + (r.current_occupancy || 0), 0) / (h.total_beds || 1)) * 100) : 0,
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
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const { fc: formatCurrency, fc, symbol } = useCurrency();

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
                { id: "reviews" as Tab, label: "Reviews", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                { id: "discount" as Tab, label: "Discount", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
                { id: "conversations" as Tab, label: "Conversations", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
                { id: "business" as Tab, label: "Business Plan", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { id: "subscription" as Tab, label: "Subscription", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
                { id: "meta" as Tab, label: "Meta Data", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
                { id: "qrcode" as Tab, label: "QR Code", icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" },
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
                      <p className="text-sm font-semibold text-gray-700">{hostel.phone || "-"}</p>
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
                      <p className="text-sm font-semibold text-gray-700">{hostel.email || "-"}</p>
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
                      <p className="text-sm font-semibold text-gray-700">{hostel.address || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map - like reference project */}
            {hostel.latitude && hostel.longitude && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-base font-bold text-gray-900">Location on Map</h3>
                </div>
                <div className="p-4">
                  <LeafletMap latitude={hostel.latitude} longitude={hostel.longitude} name={hostel.name} address={hostel.address} height="300px" />
                </div>
              </div>
            )}

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
                    <span className="text-sm text-gray-600">{hostel.owner_phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{hostel.owner_email || "-"}</span>
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
                    <p className="text-sm font-bold text-gray-900">{hostel.zone_name || "-"}</p>
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

            {/* Location with Map */}
            {hostel.latitude && hostel.longitude && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-base font-bold text-gray-900">Location</h3>
                </div>
                <div className="p-4">
                  <LeafletMap latitude={hostel.latitude} longitude={hostel.longitude} name={hostel.name} address={hostel.address} height="220px" />
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    {hostel.latitude.toFixed(6)}, {hostel.longitude.toFixed(6)}
                  </p>
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
                        <span className="text-sm font-medium text-gray-900">{booking.student_name || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{booking.room_number || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(booking.check_in)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{booking.check_out ? formatDate(booking.check_out) : "-"}</span>
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

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── REVIEWS TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          {/* Rating Overview - like reference */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-900">Rating Overview</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Overall Score */}
                <div className="text-center md:text-left md:min-w-[160px]">
                  <h1 className="text-5xl font-bold text-gray-900">
                    {reviewStats?.avg_rating || "0.0"}<span className="text-2xl text-gray-400 font-normal">/5</span>
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = reviewStats?.avg_rating || 0;
                      return (
                        <svg key={star} className={`w-5 h-5 ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{reviewStats?.total_reviews || 0} reviews</p>
                </div>

                {/* Right: Rating Breakdown */}
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Excellent", count: reviewStats?.five_star || 0, color: "bg-emerald-500" },
                    { label: "Good", count: reviewStats?.four_star || 0, color: "bg-green-400" },
                    { label: "Average", count: reviewStats?.three_star || 0, color: "bg-amber-400" },
                    { label: "Below Average", count: reviewStats?.two_star || 0, color: "bg-orange-400" },
                    { label: "Poor", count: reviewStats?.one_star || 0, color: "bg-red-400" },
                  ].map((item) => {
                    const total = reviewStats?.total_reviews || 1;
                    const pct = Math.round((item.count / total) * 100);
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-28 text-right">{item.label}</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-8">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-900">Review List</h3>
            </div>
            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-gray-400">No reviews yet</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600 shrink-0">
                          {review.user_name ? review.user_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{review.user_name || "Anonymous"}</p>
                              <p className="text-xs text-gray-400">{review.user_email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                              <button onClick={() => toggleReviewVisibility(review.id, review.status)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold ${review.status ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                {review.status ? "Visible" : "Hidden"}
                              </button>
                            </div>
                          </div>
                          {/* Rating */}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm font-semibold text-amber-600">{review.rating}</span>
                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          {/* Comment */}
                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                          )}
                          {/* Reply */}
                          {review.reply ? (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Admin Reply:</p>
                              <p className="text-sm text-gray-600">{review.reply}</p>
                            </div>
                          ) : (
                            <div className="mt-3">
                              {replyingTo === review.id ? (
                                <div className="flex items-center gap-2">
                                  <input type="text" value={replyText[review.id] || ""}
                                    onChange={e => setReplyText({ ...replyText, [review.id]: e.target.value })}
                                    onKeyDown={e => { if (e.key === "Enter") submitReply(review.id); }}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                                  <button onClick={() => submitReply(review.id)} className="px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">Reply</button>
                                  <button onClick={() => setReplyingTo(null)} className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setReplyingTo(review.id)} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                  Reply to this review
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {reviewTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-sm text-gray-400">Page {reviewPage} of {reviewTotalPages}</p>
                    <div className="flex gap-2">
                      <button onClick={() => fetchReviews(reviewPage - 1)} disabled={reviewPage <= 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-50">
                        Previous
                      </button>
                      <button onClick={() => fetchReviews(reviewPage + 1)} disabled={reviewPage >= reviewTotalPages}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-50">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── DISCOUNT TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "discount" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Discount Information</h3>
                <p className="text-xs text-gray-400">{discount ? "This discount is applied on all bookings" : "No discount configured"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDiscountModal(true)}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={discount ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                </svg>
                {discount ? "Update Discount" : "Add Discount"}
              </button>
              {discount && (
                <button onClick={deleteDiscount}
                  className="px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {discount ? (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                * This discount is applied on all the bookings for this hostel
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Discount Amount */}
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <p className="text-sm text-purple-500 font-medium mb-2">Discount Amount</p>
                <p className="text-5xl font-bold text-purple-700">
                  {discount ? parseFloat(discount.discount).toFixed(0) : "0"}<span className="text-2xl">%</span>
                </p>
              </div>

              {/* Duration */}
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-4">Duration</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Start Date:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {discount ? formatDate(discount.start_date) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">End Date:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {discount ? formatDate(discount.end_date) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Time:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {discount ? `${discount.start_time?.substring(0,5)} - ${discount.end_time?.substring(0,5)}` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Conditions */}
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-4">Purchase Conditions</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Min Purchase:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {discount ? formatCurrency(parseFloat(discount.min_purchase)) : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Max Discount:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {discount ? formatCurrency(parseFloat(discount.max_discount)) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Modal */}
          {showDiscountModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{discount ? "Update" : "Add"} Discount</h3>
                  <button onClick={() => setShowDiscountModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount (%)</label>
                      <input type="number" min="0" max="100" step="0.01"
                        value={discountForm.discount}
                        onChange={e => setDiscountForm({ ...discountForm, discount: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{`Min Purchase (${symbol})`}</label>
                      <input type="number" min="0" step="0.01"
                        value={discountForm.min_purchase}
                        onChange={e => setDiscountForm({ ...discountForm, min_purchase: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{`Max Discount (${symbol})`}</label>
                      <input type="number" min="0" step="0.01"
                        value={discountForm.max_discount}
                        onChange={e => setDiscountForm({ ...discountForm, max_discount: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                      <input type="date"
                        value={discountForm.start_date}
                        onChange={e => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                      <input type="date"
                        value={discountForm.end_date}
                        onChange={e => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                      <input type="time"
                        value={discountForm.start_time}
                        onChange={e => setDiscountForm({ ...discountForm, start_time: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                      <input type="time"
                        value={discountForm.end_time}
                        onChange={e => setDiscountForm({ ...discountForm, end_time: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button onClick={() => setShowDiscountModal(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={saveDiscount} disabled={savingDiscount}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2">
                    {savingDiscount ? (
                      <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
                    ) : (
                      <>{discount ? "Update" : "Add"} Discount</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── CONVERSATIONS TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "conversations" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col shrink-0 ${selectedConv ? "hidden lg:flex" : "flex"}`}>
              <div className="p-3 border-b border-gray-50">
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search..." value={convSearch} onChange={e => { setConvSearch(e.target.value); fetchConversations(e.target.value); }} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : conversations.map(conv => (
                  <button key={conv.id} onClick={() => selectConversation(conv)} className={`w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${selectedConv?.id === conv.id ? "bg-purple-50 border-l-2 border-l-purple-500" : ""}`}>
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                      {conv.user_name ? conv.user_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.user_name || "Unknown"}</p>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatDate(conv.updated_at)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 truncate">{conv.last_message || "No messages yet"}</p>
                        {(conv.unread_count || 0) > 0 && <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-[9px] font-bold rounded-full shrink-0">{conv.unread_count}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedConv ? "flex" : "hidden lg:flex"}`}>
              {selectedConv ? (
                <>
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <button onClick={() => setSelectedConv(null)} className="lg:hidden text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                      {selectedConv.user_name ? selectedConv.user_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedConv.user_name}</p>
                      <p className="text-[11px] text-gray-400">{selectedConv.user_email}</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                    {convMessages.length === 0 ? (
                      <div className="text-center py-16 text-gray-400"><p className="text-sm">No messages yet</p></div>
                    ) : convMessages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_type === "user" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.sender_type === "user" ? "bg-white border border-gray-200 text-gray-800 rounded-bl-md" : m.sender_type === "owner" ? "bg-blue-600 text-white rounded-br-md" : "bg-purple-600 text-white rounded-br-md"}`}>
                          {m.sender_type !== "admin" && m.sender_name && (
                            <p className={`text-[10px] font-semibold mb-0.5 ${m.sender_type === "owner" ? "text-blue-200" : "text-gray-400"}`}>{m.sender_name}</p>
                          )}
                          <p className="text-sm leading-relaxed">{m.message}</p>
                          <p className={`text-[10px] mt-1 ${m.sender_type === "user" ? "text-gray-400" : "text-white/60"}`}>{new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                      <input type="text" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendConvMessage(); } }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400" />
                      <button onClick={sendConvMessage} disabled={sendingMessage || !newMessage.trim()} className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <p className="text-gray-400 text-sm">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── BUSINESS PLAN TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "business" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Business Plan</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure business rules and commission settings for this hostel</p>
            </div>
            <button onClick={saveBusinessSettings} disabled={savingBusiness} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
              {savingBusiness ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Settings</>
              )}
            </button>
          </div>
          <div className="p-6">
            {/* Per-Hostel Commission Settings (Editable) */}
            <div className="mb-6 p-5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Per-Hostel Commission</h4>
                    <p className="text-xs text-gray-500">Edit commission settings for this hostel</p>
                  </div>
                </div>
                <button onClick={saveCommissionSettings} disabled={savingCommission} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center gap-2">
                  {savingCommission ? (
                    <><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
                  ) : (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Commission</>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <label className="block text-xs text-gray-500 mb-1">Business Model</label>
                  <select 
                    value={editCommissionModel} 
                    onChange={e => setEditCommissionModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="commission">Commission</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-200">
                  <label className="block text-xs text-emerald-600 mb-1">Commission Rate (%)</label>
                  <input 
                    type="number" 
                    value={editCommissionRate} 
                    onChange={e => setEditCommissionRate(e.target.value)}
                    min="0" max="100" step="0.5"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Business Settings Schema */}
            {businessSchema.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-purple-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                <p>Loading settings...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {businessSchema.map(schema => (
                  <div key={schema.key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{schema.label}</label>
                    {schema.type === "toggle" ? (
                      <button onClick={() => setBusinessForm({ ...businessForm, [schema.key]: businessForm[schema.key] === "1" ? "0" : "1" })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${businessForm[schema.key] === "1" ? "bg-purple-600" : "bg-gray-300"}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${businessForm[schema.key] === "1" ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    ) : schema.type === "select" ? (
                      <select value={businessForm[schema.key] || ""} onChange={e => setBusinessForm({ ...businessForm, [schema.key]: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                        {(schema.options || []).map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                      </select>
                    ) : (
                      <input type="number" value={businessForm[schema.key] || ""} onChange={e => setBusinessForm({ ...businessForm, [schema.key]: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── SUBSCRIPTION MANAGEMENT TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          {subLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading subscription data...</p>
            </div>
          ) : hostelSubData ? (
            <>
              {/* Business Model Selector */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h3 className="text-base font-bold text-gray-900">Business Model</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Switch between commission and subscription model for this hostel</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Commission Option */}
                    <button
                      onClick={() => handleSubscriptionAction("change_model", { business_model: "commission", commission_rate: editCommissionRate })}
                      disabled={subAction === "change_model"}
                      className={`p-5 rounded-xl border-2 transition-all text-left ${
                        hostelSubData.hostel?.business_model === "commission"
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          hostelSubData.hostel?.business_model === "commission" ? "bg-amber-100" : "bg-gray-100"
                        }`}>
                          <svg className={`w-5 h-5 ${
                            hostelSubData.hostel?.business_model === "commission" ? "text-amber-600" : "text-gray-500"
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Commission Model</h4>
                          <p className="text-xs text-gray-500">Platform takes % per booking</p>
                        </div>
                      </div>
                      {hostelSubData.hostel?.business_model === "commission" && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">Active</span>
                          <span className="text-sm font-semibold text-amber-700">{hostelSubData.hostel?.commission_rate || 12}% per booking</span>
                        </div>
                      )}
                    </button>

                    {/* Subscription Option */}
                    <button
                      onClick={() => handleSubscriptionAction("change_model", { business_model: "subscription" })}
                      disabled={subAction === "change_model"}
                      className={`p-5 rounded-xl border-2 transition-all text-left ${
                        hostelSubData.hostel?.business_model === "subscription"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          hostelSubData.hostel?.business_model === "subscription" ? "bg-purple-100" : "bg-gray-100"
                        }`}>
                          <svg className={`w-5 h-5 ${
                            hostelSubData.hostel?.business_model === "subscription" ? "text-purple-600" : "text-gray-500"
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Subscription Model</h4>
                          <p className="text-xs text-gray-500">Fixed monthly/quarterly payment</p>
                        </div>
                      </div>
                      {hostelSubData.hostel?.business_model === "subscription" && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">Active</span>
                          <span className="text-sm font-semibold text-purple-700">
                            {hostelSubData.active_subscription ? hostelSubData.active_subscription.plan_name : "No plan assigned"}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Commission Rate (when commission is selected) */}
                  {hostelSubData.hostel?.business_model === "commission" && (
                    <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Commission Rate</p>
                          <p className="text-xs text-amber-600">Percentage charged per booking</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editCommissionRate}
                            onChange={(e) => setEditCommissionRate(e.target.value)}
                            min="0" max="100" step="0.5"
                            className="w-20 px-3 py-2 border border-amber-300 rounded-lg text-sm font-bold text-amber-700 text-center focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                          <span className="text-sm font-bold text-amber-700">%</span>
                          <button
                            onClick={() => handleSubscriptionAction("change_model", { business_model: "commission", commission_rate: editCommissionRate })}
                            disabled={subAction === "change_model"}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Subscription (when subscription model is active) */}
              {hostelSubData.hostel?.business_model === "subscription" && (
                <>
                  {/* Active Subscription Card */}
                  {hostelSubData.active_subscription ? (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className={`px-6 py-4 ${
                        hostelSubData.active_subscription.computed_status === "grace" 
                          ? "bg-gradient-to-r from-amber-500 to-orange-600"
                          : hostelSubData.active_subscription.computed_status === "expired"
                          ? "bg-gradient-to-r from-red-500 to-rose-600"
                          : "bg-gradient-to-r from-emerald-600 to-teal-700"
                      } text-white`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-white/70">Current Subscription</p>
                            <h3 className="text-lg font-bold">{hostelSubData.active_subscription.plan_name}</h3>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            hostelSubData.active_subscription.computed_status === "active" ? "bg-white/20" :
                            hostelSubData.active_subscription.computed_status === "grace" ? "bg-amber-800/50" :
                            "bg-red-800/50"
                          }`}>
                            {hostelSubData.active_subscription.computed_status === "grace" ? "Grace Period" :
                             hostelSubData.active_subscription.computed_status.charAt(0).toUpperCase() +
                             hostelSubData.active_subscription.computed_status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400">Plan Type</p>
                            <p className="text-sm font-bold text-gray-900">{hostelSubData.active_subscription.plan_type === "half_yearly" ? "Half Yearly" : hostelSubData.active_subscription.plan_type?.charAt(0).toUpperCase() + hostelSubData.active_subscription.plan_type?.slice(1)}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400">Amount Paid</p>
                            <p className="text-sm font-bold text-gray-900">{fc(hostelSubData.active_subscription.amount_paid)}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400">Start Date</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(hostelSubData.active_subscription.start_date).toLocaleDateString()}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400">End Date</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(hostelSubData.active_subscription.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Status Alerts */}
                        {hostelSubData.active_subscription.computed_status === "active" && hostelSubData.active_subscription.days_remaining > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                            <p className="text-sm text-emerald-700 font-medium">⏰ {hostelSubData.active_subscription.days_remaining} days remaining</p>
                          </div>
                        )}
                        {hostelSubData.active_subscription.computed_status === "grace" && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                            <p className="text-sm text-amber-700 font-medium">⚠️ Grace period: {hostelSubData.active_subscription.grace_days_remaining} days left before access blocked!</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleSubscriptionAction("extend", { extend_days: extendDays })}
                            disabled={subAction === "extend"}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                          >
                            {subAction === "extend" ? (
                              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Extending...</>
                            ) : (
                              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Extend (+{extendDays} days)</>
                            )}
                          </button>
                          <select
                            value={extendDays}
                            onChange={(e) => setExtendDays(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                          </select>
                          <button
                            onClick={() => handleSubscriptionAction("renew")}
                            disabled={subAction === "renew"}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all"
                          >
                            {subAction === "renew" ? "Renewing..." : "Renew"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this subscription?")) {
                                handleSubscriptionAction("cancel");
                              }
                            }}
                            disabled={subAction === "cancel"}
                            className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-all"
                          >
                            {subAction === "cancel" ? "Cancelling..." : "Cancel Subscription"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* No Active Subscription */
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                      <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Subscription</h3>
                      <p className="text-sm text-gray-500 mb-6">This hostel is on subscription model but has no active plan</p>
                    </div>
                  )}

                  {/* Assign New Plan */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                      <h3 className="text-base font-bold text-gray-900">
                        {hostelSubData.active_subscription ? "Change Plan" : "Assign Plan"}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Select a subscription plan for this hostel</p>
                    </div>
                    <div className="p-6">
                      {availablePlans.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No active plans available. Create plans in Subscription Management first.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                            {availablePlans.map((plan) => (
                              <button
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  selectedPlanId === plan.id
                                    ? "border-purple-500 bg-purple-50"
                                    : hostelSubData.active_subscription?.plan_id === plan.id
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                    {plan.plan_type === "half_yearly" ? "Half Yr" : plan.plan_type?.charAt(0).toUpperCase() + plan.plan_type?.slice(1)}
                                  </span>
                                  {hostelSubData.active_subscription?.plan_id === plan.id && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Current</span>
                                  )}
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">{plan.name}</h4>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-bold text-gray-900">{fc(plan.amount - (plan.amount * (plan.discount_percent || 0) / 100))}</span>
                                  {plan.discount_percent > 0 && (
                                    <>
                                      <span className="text-sm text-gray-400 line-through">{fc(plan.amount)}</span>
                                      <span className="text-xs text-emerald-600 font-bold">{plan.discount_percent}% OFF</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{plan.grace_period_days}-day grace period</p>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              if (selectedPlanId) {
                                if (hostelSubData.active_subscription) {
                                  if (confirm("This will cancel the current subscription and assign the new plan. Continue?")) {
                                    handleSubscriptionAction("assign_plan", { plan_id: selectedPlanId });
                                  }
                                } else {
                                  handleSubscriptionAction("assign_plan", { plan_id: selectedPlanId });
                                }
                              }
                            }}
                            disabled={!selectedPlanId || subAction === "assign_plan"}
                            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          >
                            {subAction === "assign_plan" ? (
                              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Assigning...</>
                            ) : (
                              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{hostelSubData.active_subscription ? "Change Plan" : "Assign Plan"}</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subscription History */}
                  {hostelSubData.all_subscriptions?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-50">
                        <h3 className="text-base font-bold text-gray-900">Subscription History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {hostelSubData.all_subscriptions.map((sub: any) => (
                              <tr key={sub.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-3">
                                  <p className="text-sm font-semibold text-gray-900">{sub.plan_name}</p>
                                  <p className="text-xs text-gray-400">{sub.plan_type}</p>
                                </td>
                                <td className="px-6 py-3 text-sm font-bold text-gray-900">{fc(sub.amount_paid)}</td>
                                <td className="px-6 py-3">
                                  <p className="text-xs text-gray-600">{new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}</p>
                                </td>
                                <td className="px-6 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    sub.computed_status === "active" ? "bg-emerald-100 text-emerald-700" :
                                    sub.computed_status === "grace" ? "bg-amber-100 text-amber-700" :
                                    sub.computed_status === "expired" ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-700"
                                  }`}>
                                    {sub.computed_status === "grace" ? "Grace" : sub.computed_status?.charAt(0).toUpperCase() + sub.computed_status?.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    sub.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" :
                                    sub.payment_status === "pending" ? "bg-amber-100 text-amber-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {sub.payment_status?.charAt(0).toUpperCase() + sub.payment_status?.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Failed to load subscription data</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── META DATA TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "meta" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Meta Data / SEO</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure search engine optimization settings for this hostel</p>
            </div>
            <button onClick={saveMetaData} disabled={savingMeta} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
              {savingMeta ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Meta Data</>
              )}
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Meta Image */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Meta Image</h4>
              <p className="text-xs text-gray-400 mb-3">Upload image for social sharing (Ratio 2:1)</p>
              <label htmlFor="meta-image-upload" className="cursor-pointer block w-64">
                <div className="w-full aspect-[2/1] rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 transition-all overflow-hidden bg-white flex items-center justify-center">
                  {metaImagePreview ? (
                    <img src={metaImagePreview} alt="Meta" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-xs text-gray-400">Click to upload</p>
                    </div>
                  )}
                </div>
              </label>
              <input type="file" id="meta-image-upload" accept="image/*" onChange={handleMetaImage} className="hidden" />
            </div>

            {/* Meta Title & Description */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Meta Tags</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Meta Title
                    <span className="ml-2 text-[10px] text-gray-400">{((metaForm.meta_title || "").length)}/100</span>
                  </label>
                  <input type="text" maxLength={100} value={metaForm.meta_title || ""} onChange={e => setMetaForm({ ...metaForm, meta_title: e.target.value })}
                    placeholder="Enter meta title" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Meta Description
                    <span className="ml-2 text-[10px] text-gray-400">{((metaForm.meta_description || "").length)}/160</span>
                  </label>
                  <textarea rows={3} maxLength={160} value={metaForm.meta_description || ""} onChange={e => setMetaForm({ ...metaForm, meta_description: e.target.value })}
                    placeholder="Enter meta description" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none" />
                </div>
              </div>
            </div>

            {/* Indexing Controls */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Search Engine Indexing</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="radio" name="meta_index" checked={metaForm.meta_index === "index"} onChange={() => setMetaForm({ ...metaForm, meta_index: "index" })}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Index</span>
                      <p className="text-[11px] text-gray-400">Allow search engines to index this page</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="radio" name="meta_index" checked={metaForm.meta_index === "noindex"} onChange={() => setMetaForm({ ...metaForm, meta_index: "noindex" })}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">No Index</span>
                      <p className="text-[11px] text-gray-400">Prevent search engines from indexing</p>
                    </div>
                  </label>
                </div>
                <div className="space-y-3">
                  {["meta_no_follow", "meta_no_image_index", "meta_no_archive", "meta_no_snippet"].map(key => (
                    <label key={key} className="flex items-center gap-3">
                      <input type="checkbox" checked={metaForm[key] === "1"} onChange={e => setMetaForm({ ...metaForm, [key]: e.target.checked ? "1" : "0" })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">{key.replace("meta_no_", "No ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Controls */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Advanced Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Snippet Length</label>
                  <input type="number" value={metaForm.meta_max_snippet || ""} onChange={e => setMetaForm({ ...metaForm, meta_max_snippet: e.target.value })}
                    placeholder="-1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Video Preview (sec)</label>
                  <input type="number" value={metaForm.meta_max_video_preview || ""} onChange={e => setMetaForm({ ...metaForm, meta_max_video_preview: e.target.value })}
                    placeholder="-1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Image Preview</label>
                  <select value={metaForm.meta_max_image_preview || "large"} onChange={e => setMetaForm({ ...metaForm, meta_max_image_preview: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                    <option value="large">Large</option>
                    <option value="medium">Medium</option>
                    <option value="small">Small</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── QR CODE TAB ── */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === "qrcode" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* QR Preview */}
          <div className="lg:w-[420px]">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">QR Card Preview</h3>
                <button onClick={() => window.print()} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </button>
              </div>
              <div className="p-6">
                {/* QR Card Design - matches reference */}
                <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ background: "linear-gradient(180deg, #FFFCF8 48%, #27364B 48%)" }}>
                  <div className="pt-8 pb-4 px-4">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow-lg border-2 border-white">
                        {hostel?.logo ? (
                          <img src={hostel.logo} alt={hostel.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-2xl">
                            {hostel?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Title */}
                    <div className="text-center">
                      <div className="inline-block border-t border-b px-6 py-1" style={{ borderColor: "rgba(247,196,70,0.4)", fontSize: "16.8px" }}>
                        {qrForm.qr_title || "View Our Rooms"}
                      </div>
                    </div>
                    {/* QR Code SVG */}
                    <div className="flex justify-center my-5">
                      <div className="bg-white rounded-lg p-3">
                        <svg viewBox="0 0 100 100" className="w-32 h-32">
                          <rect width="100" height="100" fill="white"/>
                          <rect x="5" y="5" width="25" height="25" rx="2" fill="black"/>
                          <rect x="8" y="8" width="19" height="19" rx="1" fill="white"/>
                          <rect x="11" y="11" width="13" height="13" rx="1" fill="black"/>
                          <rect x="70" y="5" width="25" height="25" rx="2" fill="black"/>
                          <rect x="73" y="8" width="19" height="19" rx="1" fill="white"/>
                          <rect x="76" y="11" width="13" height="13" rx="1" fill="black"/>
                          <rect x="5" y="70" width="25" height="25" rx="2" fill="black"/>
                          <rect x="8" y="73" width="19" height="19" rx="1" fill="white"/>
                          <rect x="11" y="76" width="13" height="13" rx="1" fill="black"/>
                          {[35,40,45,50,55,60].map(x => [35,40,45,50,55,60].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill="black"/>))}
                          <rect x="35" y="5" width="3" height="3" fill="black"/><rect x="40" y="5" width="3" height="3" fill="black"/><rect x="50" y="5" width="3" height="3" fill="black"/><rect x="60" y="5" width="3" height="3" fill="black"/>
                          <rect x="35" y="15" width="3" height="3" fill="black"/><rect x="45" y="15" width="3" height="3" fill="black"/><rect x="55" y="15" width="3" height="3" fill="black"/>
                          <rect x="35" y="25" width="3" height="3" fill="black"/><rect x="40" y="25" width="3" height="3" fill="black"/><rect x="50" y="25" width="3" height="3" fill="black"/><rect x="60" y="25" width="3" height="3" fill="black"/>
                          <rect x="35" y="70" width="3" height="3" fill="black"/><rect x="45" y="70" width="3" height="3" fill="black"/><rect x="55" y="70" width="3" height="3" fill="black"/>
                          <rect x="40" y="80" width="3" height="3" fill="black"/><rect x="50" y="80" width="3" height="3" fill="black"/><rect x="60" y="80" width="3" height="3" fill="black"/>
                          <rect x="35" y="90" width="3" height="3" fill="black"/><rect x="45" y="90" width="3" height="3" fill="black"/><rect x="55" y="90" width="3" height="3" fill="black"/>
                          <rect x="70" y="35" width="3" height="3" fill="black"/><rect x="80" y="35" width="3" height="3" fill="black"/><rect x="90" y="35" width="3" height="3" fill="black"/>
                          <rect x="75" y="45" width="3" height="3" fill="black"/><rect x="85" y="45" width="3" height="3" fill="black"/>
                          <rect x="70" y="55" width="3" height="3" fill="black"/><rect x="80" y="55" width="3" height="3" fill="black"/><rect x="90" y="55" width="3" height="3" fill="black"/>
                          <rect x="70" y="70" width="3" height="3" fill="black"/><rect x="80" y="70" width="3" height="3" fill="black"/><rect x="90" y="70" width="3" height="3" fill="black"/>
                          <rect x="75" y="80" width="3" height="3" fill="black"/><rect x="85" y="80" width="3" height="3" fill="black"/>
                          <rect x="70" y="90" width="3" height="3" fill="black"/><rect x="80" y="90" width="3" height="3" fill="black"/><rect x="90" y="90" width="3" height="3" fill="black"/>
                        </svg>
                      </div>
                    </div>
                    {/* Scan Me */}
                    <div className="text-center text-xs font-medium mt-2" style={{ color: "rgba(255,255,255,0.8)", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Scan Me</div>
                  </div>
                  {/* Description */}
                  <div className="text-center text-white text-xs px-6 py-2" style={{ borderTop: "1px solid rgba(247,196,70,0.4)", borderBottom: "1px solid rgba(247,196,70,0.4)" }}>
                    {qrForm.qr_description || "Check our rooms online, just open your phone & scan this QR Code"}
                  </div>
                  {/* Phone */}
                  <div className="text-center text-white text-xs py-2">
                    Phone: {qrForm.qr_phone || hostel?.phone || "+00 123 4567890"}
                  </div>
                  {/* Bottom Bar */}
                  <div className="flex text-white text-xs" style={{ backgroundColor: "#2E3F55" }}>
                    <div className="flex-1 text-center py-2 border-r border-white/30">{qrForm.qr_website || "www.hostel.com"}</div>
                    <div className="flex-1 text-center py-2">{hostel?.email || "email@hostel.com"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Settings Form */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">QR Code Settings</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Customize your QR code card information</p>
                </div>
                <button onClick={saveQRData} disabled={savingQR} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20">
                  {savingQR ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save QR Code</>
                  )}
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input type="text" value={qrForm.qr_title || ""} onChange={e => setQRForm({ ...qrForm, qr_title: e.target.value })}
                    placeholder="Ex: View Our Rooms" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input type="text" value={qrForm.qr_description || ""} onChange={e => setQRForm({ ...qrForm, qr_description: e.target.value })}
                    placeholder="Ex: Check our rooms online" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={qrForm.qr_phone || ""} onChange={e => setQRForm({ ...qrForm, qr_phone: e.target.value })}
                    placeholder="Ex: +91 9876543210" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input type="text" value={qrForm.qr_website || ""} onChange={e => setQRForm({ ...qrForm, qr_website: e.target.value })}
                    placeholder="Ex: www.yourhostel.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
                <div className="pt-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-blue-700">The QR code will link to your hostel's booking page. Students can scan it to view rooms and make bookings.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
