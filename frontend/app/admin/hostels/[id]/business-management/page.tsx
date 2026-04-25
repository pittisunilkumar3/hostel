"use client";

import { useEffect, useState, use } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const DAYS = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

interface Schedule {
  id: number;
  hostel_id: number;
  day: number;
  opening_time: string;
  closing_time: string;
}

export default function BusinessManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const hostelId = parseInt(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "schedule" | "meta">("config");

  // ── Booking Type ──
  const [bookingDelivery, setBookingDelivery] = useState(true);
  const [bookingWalkin, setBookingWalkin] = useState(true);
  const [bookingDinein, setBookingDinein] = useState(false);

  // ── Regular Booking ──
  const [instantBooking, setInstantBooking] = useState(true);
  const [scheduledBooking, setScheduledBooking] = useState(false);

  // ── Booking Config ──
  const [minimumBookingAmount, setMinimumBookingAmount] = useState("0");
  const [scheduleDuration, setScheduleDuration] = useState("30");
  const [scheduleDurationUnit, setScheduleDurationUnit] = useState("day");

  // ── Check-in Setup ──
  const [freeCheckin, setFreeCheckin] = useState(false);
  const [freeCheckinDistStatus, setFreeCheckinDistStatus] = useState(false);
  const [freeCheckinDistValue, setFreeCheckinDistValue] = useState("");
  const [minCheckinCharge, setMinCheckinCharge] = useState("0");
  const [perKmCharge, setPerKmCharge] = useState("0");
  const [maxCheckinCharge, setMaxCheckinCharge] = useState("");

  // ── GST / Tax ──
  const [gstStatus, setGstStatus] = useState(false);
  const [gstCode, setGstCode] = useState("");

  // ── Other ──
  const [veg, setVeg] = useState(false);
  const [nonVeg, setNonVeg] = useState(true);
  const [halalStatus, setHalalStatus] = useState(false);
  const [cutlery, setCutlery] = useState(false);
  const [extraPackagingActive, setExtraPackagingActive] = useState(false);
  const [extraPackagingAmount, setExtraPackagingAmount] = useState("0");
  const [extraPackagingRequired, setExtraPackagingRequired] = useState(false);
  const [customerDateOrderStatus, setCustomerDateOrderStatus] = useState(false);
  const [customerOrderDateDays, setCustomerOrderDateDays] = useState("30");

  // ── Tags ──
  const [tags, setTags] = useState("");
  const [characteristics, setCharacteristics] = useState("");

  // ── Schedule ──
  const [alwaysOpen, setAlwaysOpen] = useState(false);
  const [sameTimeEveryDay, setSameTimeEveryDay] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newScheduleDay, setNewScheduleDay] = useState(1);
  const [newScheduleOpen, setNewScheduleOpen] = useState("08:00");
  const [newScheduleClose, setNewScheduleClose] = useState("22:00");

  // ── Meta Data ──
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaIndex, setMetaIndex] = useState("index");
  const [metaNoFollow, setMetaNoFollow] = useState(false);
  const [metaNoImageIndex, setMetaNoImageIndex] = useState(false);
  const [metaNoArchive, setMetaNoArchive] = useState(false);
  const [metaNoSnippet, setMetaNoSnippet] = useState(false);

  // ── Hostel name for breadcrumb ──
  const [hostelName, setHostelName] = useState("");

  useEffect(() => {
    fetchData();
  }, [hostelId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/api/hostels/${hostelId}/business-management`);
      const data = await res.json();
      if (data.success) {
        const m = data.data.management;
        setHostelName(m.name || "");

        setBookingDelivery(!!m.booking_type_delivery);
        setBookingWalkin(!!m.booking_type_walkin);
        setBookingDinein(!!m.booking_type_dinein);
        setInstantBooking(!!m.instant_booking);
        setScheduledBooking(!!m.scheduled_booking);
        setMinimumBookingAmount(m.minimum_booking_amount?.toString() || "0");
        setScheduleDuration(m.schedule_booking_duration?.toString() || "30");
        setScheduleDurationUnit(m.schedule_booking_duration_unit || "day");

        setFreeCheckin(!!m.free_checkin);
        setFreeCheckinDistStatus(!!m.free_checkin_distance_status);
        setFreeCheckinDistValue(m.free_checkin_distance_value?.toString() || "");
        setMinCheckinCharge(m.minimum_checkin_charge?.toString() || "0");
        setPerKmCharge(m.per_km_checkin_charge?.toString() || "0");
        setMaxCheckinCharge(m.maximum_checkin_charge?.toString() || "");

        setGstStatus(!!m.gst_status);
        setGstCode(m.gst_code || "");

        setVeg(!!m.veg);
        setNonVeg(!!m.non_veg);
        setHalalStatus(!!m.halal_status);
        setCutlery(!!m.cutlery);
        setExtraPackagingActive(!!m.extra_packaging_active);
        setExtraPackagingAmount(m.extra_packaging_amount?.toString() || "0");
        setExtraPackagingRequired(!!m.extra_packaging_required);
        setCustomerDateOrderStatus(!!m.customer_date_order_status);
        setCustomerOrderDateDays(m.customer_order_date_days?.toString() || "30");

        setTags(m.tags || "");
        setCharacteristics(m.characteristics || "");

        setAlwaysOpen(!!m.always_open);
        setSameTimeEveryDay(!!m.same_time_every_day);

        setMetaTitle(m.meta_title || "");
        setMetaDescription(m.meta_description || "");
        setMetaIndex(m.meta_index || "index");
        setMetaNoFollow(!!m.meta_no_follow);
        setMetaNoImageIndex(!!m.meta_no_image_index);
        setMetaNoArchive(!!m.meta_no_archive);
        setMetaNoSnippet(!!m.meta_no_snippet);

        setSchedules(data.data.schedules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await apiFetch(`${API}/api/hostels/${hostelId}/business-management`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_type_delivery: bookingDelivery ? 1 : 0,
          booking_type_walkin: bookingWalkin ? 1 : 0,
          booking_type_dinein: bookingDinein ? 1 : 0,
          instant_booking: instantBooking ? 1 : 0,
          scheduled_booking: scheduledBooking ? 1 : 0,
          minimum_booking_amount: parseFloat(minimumBookingAmount) || 0,
          schedule_booking_duration: parseInt(scheduleDuration) || 30,
          schedule_booking_duration_unit: scheduleDurationUnit,
          free_checkin: freeCheckin ? 1 : 0,
          free_checkin_distance_status: freeCheckinDistStatus ? 1 : 0,
          free_checkin_distance_value: parseFloat(freeCheckinDistValue) || null,
          minimum_checkin_charge: parseFloat(minCheckinCharge) || 0,
          per_km_checkin_charge: parseFloat(perKmCharge) || 0,
          maximum_checkin_charge: parseFloat(maxCheckinCharge) || null,
          gst_status: gstStatus ? 1 : 0,
          gst_code: gstCode,
          veg: veg ? 1 : 0,
          non_veg: nonVeg ? 1 : 0,
          halal_status: halalStatus ? 1 : 0,
          cutlery: cutlery ? 1 : 0,
          extra_packaging_active: extraPackagingActive ? 1 : 0,
          extra_packaging_amount: parseFloat(extraPackagingAmount) || 0,
          extra_packaging_required: extraPackagingRequired ? 1 : 0,
          customer_date_order_status: customerDateOrderStatus ? 1 : 0,
          customer_order_date_days: parseInt(customerOrderDateDays) || 30,
          tags,
          characteristics,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Configuration saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const saveMeta = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await apiFetch(`${API}/api/hostels/${hostelId}/business-management`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta_title: metaTitle,
          meta_description: metaDescription,
          meta_index: metaIndex,
          meta_no_follow: metaNoFollow ? 1 : 0,
          meta_no_image_index: metaNoImageIndex ? 1 : 0,
          meta_no_archive: metaNoArchive ? 1 : 0,
          meta_no_snippet: metaNoSnippet ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Meta data saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const saveOpeningClosing = async (alwaysOpenVal: boolean, sameTimeVal: boolean) => {
    try {
      const res = await apiFetch(`${API}/api/hostels/${hostelId}/business-management`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-opening-closing",
          always_open: alwaysOpenVal,
          same_time_every_day: sameTimeVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data.schedules);
      }
    } catch {}
  };

  const addSchedule = async () => {
    try {
      const res = await apiFetch(`${API}/api/hostels/${hostelId}/business-management`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-schedule",
          day: newScheduleDay,
          opening_time: newScheduleOpen,
          closing_time: newScheduleClose,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data.schedules);
        setShowAddSchedule(false);
      }
    } catch {}
  };

  const removeSchedule = async (scheduleId: number) => {
    if (!confirm("Are you sure you want to remove this schedule?")) return;
    try {
      const res = await apiFetch(`${API}/api/hostels/${hostelId}/business-management`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-schedule", schedule_id: scheduleId }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data.schedules);
      }
    } catch {}
  };

  const getSchedulesForDay = (dayId: number) => schedules.filter((s) => s.day === dayId);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const ic = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all";

  if (loading) {
    return (
      <DashboardShell sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading business management...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <button onClick={() => router.push("/admin/hostels")} className="hover:text-indigo-600">Hostels</button>
              <span>/</span>
              <button onClick={() => router.push(`/admin/hostels/${hostelId}/view`)} className="hover:text-indigo-600">{hostelName || `Hostel #${hostelId}`}</button>
              <span>/</span>
              <span className="text-gray-700">Business Management</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Business Configuration</h1>
            <p className="text-sm text-gray-500 mt-1">Manage booking types, schedules, tax, and meta data for {hostelName}</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={message.type === "success" ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {[
            { id: "config", label: "Business Configuration", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
            { id: "schedule", label: "Schedule & Hours", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: "meta", label: "Meta Data", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB: BUSINESS CONFIGURATION */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === "config" && (
          <div className="space-y-6">

            {/* ── Booking Type ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Booking Type</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select the booking type that is suitable for your hostel</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingDelivery ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <input type="checkbox" checked={bookingDelivery} onChange={(e) => setBookingDelivery(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Online Booking</h5>
                      <p className="text-xs text-gray-400 mt-1">If enabled customers can choose Online Booking option from the customer app and website</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingWalkin ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <input type="checkbox" checked={bookingWalkin} onChange={(e) => setBookingWalkin(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Walk-in</h5>
                      <p className="text-xs text-gray-400 mt-1">If enabled customers can use Walk-in feature during check-in from the Customer App/Website.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingDinein ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <input type="checkbox" checked={bookingDinein} onChange={(e) => setBookingDinein(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Dine In</h5>
                      <p className="text-xs text-gray-400 mt-1">If enabled customer can choose Dine-in option for order from customer App/Website</p>
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Booking Amount (₹)</label>
                    <input type="number" min="0" step="0.01" value={minimumBookingAmount} onChange={(e) => setMinimumBookingAmount(e.target.value)} className={ic} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Interval Time for Scheduled Booking</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={scheduleDuration} onChange={(e) => setScheduleDuration(e.target.value)} className={`${ic} flex-1`} />
                      <select value={scheduleDurationUnit} onChange={(e) => setScheduleDurationUnit(e.target.value)} className={`${ic} w-28`}>
                        <option value="min">Min</option>
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-start text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>You can check all your bookings from the Bookings page. Configure the booking types that best suit your hostel.</span>
                </div>
              </div>
            </div>

            {/* ── Regular Booking ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Regular Booking</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select how customers can make regular bookings</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${instantBooking ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <input type="checkbox" checked={instantBooking} onChange={(e) => setInstantBooking(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Instant Booking</h5>
                      <p className="text-xs text-gray-400 mt-1">With this feature customers can book instantly from your hostel.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${scheduledBooking ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                    <input type="checkbox" checked={scheduledBooking} onChange={(e) => setScheduledBooking(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Scheduled Booking</h5>
                      <p className="text-xs text-gray-400 mt-1">If enabled, customers can choose their preferred check-in time and date.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Check-in Setup ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Check-in Setup</h3>
                <p className="text-xs text-gray-400 mt-0.5">Setup your check-in options and charges</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                      Free Check-in
                      <button type="button" onClick={() => setFreeCheckin(!freeCheckin)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${freeCheckin ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${freeCheckin ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </label>
                    <p className="text-xs text-gray-400">If enabled, customers get free check-in service</p>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                      Free Check-in Distance (KM)
                      <button type="button" onClick={() => setFreeCheckinDistStatus(!freeCheckinDistStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${freeCheckinDistStatus ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${freeCheckinDistStatus ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </label>
                    <input type="number" min="0" step="0.001" value={freeCheckinDistValue} onChange={(e) => setFreeCheckinDistValue(e.target.value)} disabled={!freeCheckinDistStatus}
                      className={`${ic} ${!freeCheckinDistStatus ? "opacity-50 bg-gray-50" : ""}`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Check-in Charge (₹)</label>
                    <input type="number" min="0" step="0.01" value={minCheckinCharge} onChange={(e) => setMinCheckinCharge(e.target.value)} className={ic} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Charge Per KM (₹)</label>
                    <input type="number" min="0" step="0.01" value={perKmCharge} onChange={(e) => setPerKmCharge(e.target.value)} className={ic} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum Check-in Charge (₹)</label>
                    <input type="number" min="0" step="0.01" value={maxCheckinCharge} onChange={(e) => setMaxCheckinCharge(e.target.value)} className={ic} placeholder="No limit" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tags & Characteristics ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Hostel Tags & Characteristics</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select hostel characteristics and add search tags</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostel Characteristics</label>
                    <input type="text" value={characteristics} onChange={(e) => setCharacteristics(e.target.value)} className={ic} placeholder="e.g. Budget Friendly, Luxury, Co-living" />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated values</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Tags</label>
                    <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={ic} placeholder="e.g. hostel, pg, accommodation" />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated search tags to boost visibility</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Add search tags to boost up your hostel better performance when users search for accommodation.</span>
                </div>
              </div>
            </div>

            {/* ── Other Setup ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Other Setup</h3>
                <p className="text-xs text-gray-400 mt-0.5">Food type, GST, packaging, and other configurations</p>
              </div>
              <div className="p-6 space-y-4">
                {/* Veg / Non-veg */}
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border rounded-xl cursor-pointer">
                    <input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
                    <span className="text-sm font-medium text-gray-700">Veg</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border rounded-xl cursor-pointer">
                    <input type="checkbox" checked={nonVeg} onChange={(e) => setNonVeg(e.target.checked)} className="w-4 h-4 text-red-600 rounded border-gray-300" />
                    <span className="text-sm font-medium text-gray-700">Non-Veg</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Halal Status */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                      Halal Status
                      <button type="button" onClick={() => setHalalStatus(!halalStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${halalStatus ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${halalStatus ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </label>
                    <p className="text-xs text-gray-400">If enabled, customers can see halal tag on food items</p>
                  </div>
                  {/* Cutlery */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                      Cutlery On Order
                      <button type="button" onClick={() => setCutlery(!cutlery)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cutlery ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cutlery ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </label>
                    <p className="text-xs text-gray-400">If enabled, customer can choose cutlery in user app</p>
                  </div>
                </div>

                {/* GST */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                      GST
                      <button type="button" onClick={() => setGstStatus(!gstStatus)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gstStatus ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gstStatus ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </label>
                    <input type="text" value={gstCode} onChange={(e) => setGstCode(e.target.value)} disabled={!gstStatus}
                      className={`${ic} mt-2 ${!gstStatus ? "opacity-50 bg-gray-50" : ""}`} placeholder="Enter GST number" />
                  </div>
                  {/* Extra Packaging */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                      Extra Packaging Charge
                      <button type="button" onClick={() => setExtraPackagingActive(!extraPackagingActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${extraPackagingActive ? "bg-indigo-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${extraPackagingActive ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </label>
                    <input type="number" min="0" step="0.01" value={extraPackagingAmount}
                      onChange={(e) => setExtraPackagingAmount(e.target.value)} disabled={!extraPackagingActive}
                      className={`${ic} mt-2 ${!extraPackagingActive ? "opacity-50 bg-gray-50" : ""}`} placeholder="Amount" />
                    {extraPackagingActive && (
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="packaging" checked={!extraPackagingRequired} onChange={() => setExtraPackagingRequired(false)} className="text-indigo-600" />
                          <span className="text-sm text-gray-700">Optional</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="packaging" checked={extraPackagingRequired} onChange={() => setExtraPackagingRequired(true)} className="text-indigo-600" />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduled Booking - Customer Date Order */}
                {scheduledBooking && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5">
                        Custom Date Order
                        <button type="button" onClick={() => setCustomerDateOrderStatus(!customerDateOrderStatus)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${customerDateOrderStatus ? "bg-indigo-600" : "bg-gray-200"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customerDateOrderStatus ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </label>
                      <p className="text-xs text-gray-400">Customers cannot select schedule date over the given days</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Can Order Within (Days)</label>
                      <input type="number" min="0" value={customerOrderDateDays} onChange={(e) => setCustomerOrderDateDays(e.target.value)}
                        disabled={!customerDateOrderStatus} className={`${ic} ${!customerDateOrderStatus ? "opacity-50 bg-gray-50" : ""}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button onClick={() => fetchData()} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Reset
              </button>
              <button onClick={saveConfig} disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                {saving ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Configuration</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB: SCHEDULE & HOURS */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            {/* Opening/Closing Status */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Opening/Closing Status</h3>
                <p className="text-xs text-gray-400 mt-0.5">Configure whether the hostel is always open or follows a schedule</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${alwaysOpen ? "border-green-500 bg-green-50/50" : "border-gray-100 bg-gray-50/50"}`}
                    onClick={() => { const v = !alwaysOpen; setAlwaysOpen(v); saveOpeningClosing(v, sameTimeEveryDay); }}>
                    <input type="checkbox" checked={alwaysOpen} readOnly className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Always Open</h5>
                      <p className="text-xs text-gray-400 mt-1">Hostel operates 24/7 without closing</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${sameTimeEveryDay ? "border-indigo-500 bg-indigo-50/50" : "border-gray-100 bg-gray-50/50"}`}
                    onClick={() => { const v = !sameTimeEveryDay; setSameTimeEveryDay(v); saveOpeningClosing(alwaysOpen, v); }}>
                    <input type="checkbox" checked={sameTimeEveryDay} readOnly className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Same Time Every Day</h5>
                      <p className="text-xs text-gray-400 mt-1">Use the same schedule for all days of the week</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            {!alwaysOpen && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Weekly Schedule</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Set operating hours for each day of the week</p>
                  </div>
                  <button onClick={() => setShowAddSchedule(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Schedule
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {DAYS.map((day) => {
                    const daySchedules = getSchedulesForDay(day.id);
                    return (
                      <div key={day.id} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                        <span className="w-24 text-sm font-semibold text-gray-700">{day.name}</span>
                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                          {daySchedules.length > 0 ? (
                            daySchedules.map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                                {formatTime(s.opening_time)} – {formatTime(s.closing_time)}
                                <button onClick={() => removeSchedule(s.id)} className="ml-1 text-red-400 hover:text-red-600">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">Off Day</span>
                          )}
                          <button onClick={() => { setNewScheduleDay(day.id); setShowAddSchedule(true); }}
                            className="px-2 py-1 text-indigo-500 hover:bg-indigo-50 rounded-lg text-xs font-semibold">
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Schedule Modal */}
            {showAddSchedule && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Add Schedule</h3>
                    <button onClick={() => setShowAddSchedule(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Day</label>
                      <select value={newScheduleDay} onChange={(e) => setNewScheduleDay(parseInt(e.target.value))} className={ic}>
                        {DAYS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Time</label>
                        <input type="time" value={newScheduleOpen} onChange={(e) => setNewScheduleOpen(e.target.value)} className={ic} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Closing Time</label>
                        <input type="time" value={newScheduleClose} onChange={(e) => setNewScheduleClose(e.target.value)} className={ic} />
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => setShowAddSchedule(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                    <button onClick={addSchedule} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Add Schedule</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB: META DATA */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === "meta" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Hostel Meta Data</h3>
                <p className="text-xs text-gray-400 mt-0.5">Setup website meta data for SEO and search engine visibility</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
                      <input type="text" maxLength={100} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={ic} placeholder="Enter meta title" />
                      <p className="text-xs text-gray-400 mt-1 text-right">{metaTitle.length}/160</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                      <textarea maxLength={160} rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)}
                        className={`${ic} resize-none`} placeholder="Enter meta description" />
                      <p className="text-xs text-gray-400 mt-1 text-right">{metaDescription.length}/160</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Indexing Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="metaIndex" value="index" checked={metaIndex === "index"}
                          onChange={() => { setMetaIndex("index"); setMetaNoFollow(false); setMetaNoImageIndex(false); setMetaNoArchive(false); setMetaNoSnippet(false); }}
                          className="text-indigo-600" />
                        <span className="text-sm text-gray-700">Index</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="metaIndex" value="noindex" checked={metaIndex === "noindex"}
                          onChange={() => { setMetaIndex("noindex"); setMetaNoFollow(true); setMetaNoImageIndex(true); setMetaNoArchive(true); setMetaNoSnippet(true); }}
                          className="text-indigo-600" />
                        <span className="text-sm text-gray-700">No Index</span>
                      </label>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="space-y-2">
                      {[
                        { label: "No Follow", val: metaNoFollow, set: setMetaNoFollow },
                        { label: "No Image Index", val: metaNoImageIndex, set: setMetaNoImageIndex },
                        { label: "No Archive", val: metaNoArchive, set: setMetaNoArchive },
                        { label: "No Snippet", val: metaNoSnippet, set: setMetaNoSnippet },
                      ].map((item) => (
                        <label key={item.label} className="flex items-center gap-2">
                          <input type="checkbox" checked={item.val} onChange={(e) => item.set(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                          <span className="text-xs text-gray-600">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Meta Button */}
            <div className="flex justify-end gap-3">
              <button onClick={() => fetchData()} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Reset</button>
              <button onClick={saveMeta} disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                {saving ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Meta Data</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
