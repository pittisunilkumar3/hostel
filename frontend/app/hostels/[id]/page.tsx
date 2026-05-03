"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/auth";
import { useCurrency } from "@/lib/useCurrency";
import PublicHeader from "@/app/components/PublicHeader";
import PublicFooter from "@/app/components/PublicFooter";

interface Room {
  id: number;
  room_number: string;
  floor: number;
  type: string;
  capacity: number;
  current_occupancy: number;
  available: number;
  status: string;
  pricing_type: string;
  price_per_month: number | null;
  price_per_day: number | null;
  price_per_hour: number | null;
  effective_price: number | null;
  amenities: string[];
  furnishing: string[];
  dimensions: any;
  description: string;
  images: string[];
}

interface Hostel {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  latitude: number;
  longitude: number;
  logo: string | null;
  cover_photo: string | null;
  total_rooms: number;
  total_beds: number;
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  zone_name: string;
  zone_display_name: string;
  avg_rating: number | null;
  total_reviews: number;
  rooms: Room[];
  reviews: any[];
  advance_payment_enabled?: number | boolean;
  advance_payment_amount?: number | string;
  advance_payment_period?: number;
  advance_payment_period_type?: string;
  advance_payment_description?: string;
}

interface TaxInfo {
  id: number;
  name: string;
  rate: number;
  type: string;
}

export default function HostelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fc } = useCurrency();
  const id = params.id as string;

  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Tax state
  const [taxes, setTaxes] = useState<TaxInfo[]>([]);
  const [taxInclusive, setTaxInclusive] = useState(false);

  // Booking modal state
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingType, setBookingType] = useState<string>("");
  const [duration, setDuration] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  // Filter state
  const [filterType, setFilterType] = useState<string>("all");

  // Advance payment helpers (MySQL returns strings for DECIMAL)
  const advEnabled = !!(hostel?.advance_payment_enabled);
  const advAmount = Number(hostel?.advance_payment_amount) || 0;
  const advPeriod = Number(hostel?.advance_payment_period) || 0;
  const advPeriodType = hostel?.advance_payment_period_type || "month";
  const advDescription = hostel?.advance_payment_description || "";

  // Fetch taxes on mount
  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/taxes/public`);
        const data = await res.json();
        if (data.success && data.data) {
          setTaxes(data.data.taxes || []);
          setTaxInclusive(data.data.tax_inclusive || false);
        }
      } catch {}
    };
    fetchTaxes();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("hostel_location");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lng) setUserLocation({ lat: parsed.lat, lng: parsed.lng });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchHostel = async () => {
      try {
        const res = await fetch(`${API_URL}/api/hostels/${id}/public`);
        const data = await res.json();
        if (data.success && data.data) {
          setHostel(data.data);
        } else {
          setError("Hostel not found");
        }
      } catch {
        setError("Failed to load hostel details");
      }
      setLoading(false);
    };
    fetchHostel();
  }, [id]);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distance = hostel && userLocation && hostel.latitude && hostel.longitude
    ? getDistance(userLocation.lat, userLocation.lng, hostel.latitude, hostel.longitude).toFixed(1)
    : null;

  // ─── Price calculations with tax ───

  const getUnitPrice = () => {
    if (!selectedRoom || !bookingType) return 0;
    const price = bookingType === "hourly" ? selectedRoom.price_per_hour
      : bookingType === "daily" ? selectedRoom.price_per_day
      : selectedRoom.price_per_month;
    return price || 0;
  };

  const getSubtotal = () => getUnitPrice() * duration;

  const getTaxBreakdown = () => {
    const sub = getSubtotal();
    if (sub <= 0) return { totalTax: 0, items: [], grandTotal: 0 };
    let totalTax = 0;
    const items: { name: string; amount: number }[] = [];
    for (const tax of taxes) {
      let amt = 0;
      if (tax.type === "percentage") {
        if (taxInclusive) {
          amt = (sub * tax.rate) / (100 + tax.rate);
        } else {
          amt = (sub * tax.rate) / 100;
        }
      } else {
        amt = tax.rate;
      }
      amt = Math.round(amt * 100) / 100;
      if (amt > 0) {
        totalTax += amt;
        items.push({ name: `${tax.name} (${tax.rate}${tax.type === "percentage" ? "%" : ""})`, amount: amt });
      }
    }
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = taxInclusive ? sub : sub + totalTax;
    return { totalTax, items, grandTotal: Math.round(grandTotal * 100) / 100 };
  };

  const openBooking = (room: Room) => {
    setSelectedRoom(room);
    const defaultType = room.pricing_type || "monthly";
    setBookingType(defaultType);
    setDuration(1);
    setGuests(1);
    setBookingSuccess(null);
    setBookingError("");
    const today = new Date().toISOString().slice(0, 16);
    setCheckIn(today);
    setCheckOut("");
    setBookingModal(true);
  };

  const submitBooking = async () => {
    if (!selectedRoom || !hostel) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      setBookingError("Name and phone are required");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await fetch(`${API_URL}/api/bookings/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostel_id: hostel.id,
          room_id: selectedRoom.id,
          booking_type: bookingType,
          duration,
          guests,
          check_in: checkIn,
          check_out: checkOut || null,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_email: guestEmail || null,
          special_requests: specialRequests || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(data.data);
      } else {
        setBookingError(data.message || "Booking failed");
      }
    } catch {
      setBookingError("Network error. Please try again.");
    }
    setBookingLoading(false);
  };

  const roomTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: "Single", DOUBLE: "Double", TRIPLE: "Triple", QUAD: "Quad",
      DORMITORY: "Dormitory", FIVE_BED: "5-Bed", SIX_BED: "6-Bed",
    };
    return map[type] || type;
  };

  const filteredRooms = hostel?.rooms?.filter(r =>
    filterType === "all" || r.pricing_type === filterType
  ) || [];

  const pricingTypes = hostel?.rooms
    ? [...new Set(hostel.rooms.map(r => r.pricing_type).filter(Boolean))]
    : [];

  const lowestPrice = hostel?.rooms?.length
    ? Math.min(...hostel.rooms.flatMap(r =>
        [r.price_per_hour, r.price_per_day, r.price_per_month].filter((p): p is number => p !== null && p > 0)
      ))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{error || "Hostel not found"}</h2>
          <button onClick={() => router.push("/")} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Back to Home</button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const taxInfo = getTaxBreakdown();

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* ── Hero / Cover ── */}
      <div className="relative h-56 md:h-72 lg:h-80">
        {hostel.cover_photo ? (
          <img src={hostel.cover_photo} alt={hostel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 flex items-center justify-center">
            <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-medium hover:bg-white/30 transition z-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="max-w-6xl mx-auto flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="hidden md:block w-16 h-16 rounded-2xl border-2 border-white/50 overflow-hidden bg-white shadow-xl shrink-0">
                {hostel.logo ? (
                  <img src={hostel.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl">{hostel.name?.[0]?.toUpperCase()}</div>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{hostel.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {hostel.address}
                  </span>
                  {hostel.zone_display_name && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{hostel.zone_display_name}</span>}
                  {distance && <span className="bg-emerald-500 px-2 py-0.5 rounded-full text-xs font-medium">{distance} km</span>}
                </div>
              </div>
            </div>
            {hostel.avg_rating && (
              <div className="bg-white rounded-xl px-3 py-2 text-center shadow-lg shrink-0">
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span className="text-lg font-bold text-gray-800">{hostel.avg_rating}</span>
                </div>
                <div className="text-[10px] text-gray-500">{hostel.total_reviews} reviews</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-4 gap-3 -mt-6 mb-8 relative z-10">
          {[
            { label: "Rooms", value: hostel.total_rooms },
            { label: "Beds", value: hostel.total_beds },
            { label: "Check-in", value: hostel.check_in_time || "—" },
            { label: "Check-out", value: hostel.check_out_time || "—" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-md border border-gray-100 text-center">
              <div className="text-lg md:text-2xl font-bold text-emerald-600">{s.value}</div>
              <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Advance Deposit Banner ── */}
        {advEnabled && advAmount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2 6 6 0 006 6v2a6 6 0 00-6 6 2 2 0 002 2h10a2 2 0 002-2 6 6 0 00-6-6V9a6 6 0 006-6z" /></svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">
                Advance Deposit: <span className="text-amber-700">{fc(advAmount)}</span>
                {advPeriod > 0 && <span className="font-normal text-amber-700"> for {advPeriod} {advPeriodType}{advPeriod > 1 ? "s" : ""}</span>}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">{advDescription || "Advance deposit required at booking. Adjusted against your final bill at checkout."}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ══════════ MAIN ══════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-3">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{hostel.description || "No description available."}</p>
              {hostel.phone && (
                <a href={`tel:${hostel.phone}`} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {hostel.phone}
                </a>
              )}
            </div>

            {/* Amenities */}
            {hostel.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {hostel.amenities.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-xs text-emerald-800 font-medium">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── ROOMS ─── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 className="text-lg font-bold text-gray-800">Available Rooms</h2>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === "all" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
                  {pricingTypes.map(t => (
                    <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${filterType === t ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t}</button>
                  ))}
                </div>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <p className="text-sm">No rooms available for this filter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200">
                      <div className="flex flex-col sm:flex-row">
                        {/* Room image / placeholder */}
                        <div className="sm:w-44 h-32 sm:h-auto bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shrink-0">
                          {room.images?.[0] ? (
                            <img src={room.images[0]} alt={`Room ${room.room_number}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                              </div>
                              <span className="text-xs font-bold text-emerald-700">Rm {room.room_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Room details */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-sm font-bold text-gray-800">Room {room.room_number}</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">{roomTypeLabel(room.type)}</span>
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize">{room.pricing_type}</span>
                              </div>
                              {room.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{room.description}</p>}
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  {room.capacity} capacity
                                </span>
                                <span className={`flex items-center gap-1 ${room.available > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  {room.available > 0 ? `${room.available} available` : "Full"}
                                </span>
                                <span>Floor {room.floor}</span>
                              </div>
                              {room.amenities?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {room.amenities.slice(0, 5).map((a, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{a}</span>
                                  ))}
                                  {room.amenities.length > 5 && <span className="text-[10px] text-gray-400">+{room.amenities.length - 5} more</span>}
                                </div>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-right shrink-0">
                              {room.price_per_month && (
                                <div className="text-lg font-bold text-emerald-700">{fc(room.price_per_month)}<span className="text-xs font-normal text-gray-400">/mo</span></div>
                              )}
                              {room.price_per_day && (
                                <div className="text-xs text-gray-500">{fc(room.price_per_day)}/day</div>
                              )}
                              {room.price_per_hour && (
                                <div className="text-xs text-gray-500">{fc(room.price_per_hour)}/hr</div>
                              )}
                            </div>
                          </div>

                          {/* Bottom bar */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            {advEnabled && advAmount > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-700">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="font-medium">{fc(advAmount)} deposit</span>
                              </div>
                            )}
                            <div className="flex-1" />
                            <button
                              onClick={() => openBooking(room)}
                              disabled={room.available <= 0}
                              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
                            >
                              {room.available > 0 ? "Book Now" : "Fully Booked"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            {hostel.reviews?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Reviews ({hostel.total_reviews})</h2>
                <div className="space-y-4">
                  {hostel.reviews.map((rev: any) => (
                    <div key={rev.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">{rev.user_name?.[0] || "?"}</div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{rev.user_name}</div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-3 h-3 ${i < Math.round(rev.rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {rev.comment && <p className="text-xs text-gray-600 ml-11">{rev.comment}</p>}
                      {rev.reply && (
                        <div className="ml-11 mt-2 bg-emerald-50 rounded-lg p-3 text-xs text-gray-600 border border-emerald-100">
                          <span className="font-semibold text-emerald-700">Owner:</span> {rev.reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══════════ SIDEBAR ══════════ */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Contact</h3>
              <div className="space-y-2.5">
                {hostel.phone && (
                  <a href={`tel:${hostel.phone}`} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {hostel.phone}
                  </a>
                )}
                {hostel.email && (
                  <a href={`mailto:${hostel.email}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-700 font-medium text-sm hover:bg-blue-100 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Send Email
                  </a>
                )}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl text-gray-600 text-xs">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  {hostel.address}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Quick Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Available Rooms</span>
                  <span className="font-bold text-emerald-700">{hostel.rooms?.filter(r => r.available > 0).length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Starting from</span>
                  <span className="font-bold text-emerald-700">{fc(lowestPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Booking Types</span>
                  <span className="font-medium text-gray-700 capitalize text-xs">{[...new Set(hostel.rooms?.map(r => r.pricing_type))].join(", ")}</span>
                </div>
              </div>
            </div>

            {advEnabled && advAmount > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2 6 6 0 006 6v2a6 6 0 00-6 6 2 2 0 002 2h10a2 2 0 002-2 6 6 0 00-6-6V9a6 6 0 006-6z" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-amber-900">Advance Deposit</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Amount</span>
                    <span className="font-bold text-amber-900">{fc(advAmount)}</span>
                  </div>
                  {advPeriod > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-700">Covers</span>
                      <span className="font-medium text-amber-900">{advPeriod} {advPeriodType}{advPeriod > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-amber-600 mt-2 leading-relaxed">
                    {advDescription || "Required at booking. Adjusted against your final bill at checkout."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
           BOOKING MODAL
          ══════════════════════════════════════════ */}
      {bookingModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setBookingModal(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* ── Success State ── */}
            {bookingSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Booking Confirmed!</h3>
                <p className="text-sm text-gray-500 mb-5">Your booking has been placed successfully.</p>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-5">
                  <div className="flex justify-between"><span className="text-gray-500">Booking ID</span><span className="font-bold">#{bookingSuccess.booking_id}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-semibold">{selectedRoom.room_number} ({roomTypeLabel(selectedRoom.type)})</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-semibold capitalize">{bookingSuccess.booking_type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{bookingSuccess.duration} {bookingSuccess.booking_type === "hourly" ? "hour(s)" : bookingSuccess.booking_type === "daily" ? "day(s)" : "month(s)"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{fc(bookingSuccess.unit_price * bookingSuccess.duration)}</span></div>
                  {bookingSuccess.tax_amount > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-medium">{fc(bookingSuccess.tax_amount)}</span></div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-2"><span className="text-gray-800 font-bold">Total</span><span className="font-bold text-emerald-700">{fc(bookingSuccess.total_amount)}</span></div>
                  {bookingSuccess.advance_payment && Number(bookingSuccess.advance_payment.amount) > 0 && (
                    <div className="flex justify-between bg-amber-50 -mx-4 px-4 py-2 rounded-lg">
                      <span className="text-amber-700 font-medium">💰 Advance Deposit</span>
                      <span className="font-bold text-amber-800">{fc(Number(bookingSuccess.advance_payment.amount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold text-yellow-600">⏳ Pending Confirmation</span></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setBookingModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50">Close</button>
                  <button onClick={() => router.push("/")} className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700">Back to Home</button>
                </div>
              </div>
            ) : (
              <>
                {/* ── Modal Header ── */}
                <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Book Room {selectedRoom.room_number}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{roomTypeLabel(selectedRoom.type)} · Floor {selectedRoom.floor} · {selectedRoom.capacity} capacity</p>
                  </div>
                  <button onClick={() => setBookingModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {bookingError && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {bookingError}
                    </div>
                  )}

                  {/* ── Step 1: Booking Type ── */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Choose Plan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedRoom.price_per_hour && (
                        <button onClick={() => { setBookingType("hourly"); setDuration(1); }}
                          className={`relative p-3 rounded-xl border-2 text-center transition-all ${bookingType === "hourly" ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10" : "border-gray-200 hover:border-gray-300"}`}>
                          {bookingType === "hourly" && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                          <div className="text-[10px] text-gray-500 font-medium">Hourly</div>
                          <div className="text-sm font-bold text-emerald-700 mt-0.5">{fc(selectedRoom.price_per_hour)}</div>
                        </button>
                      )}
                      {selectedRoom.price_per_day && (
                        <button onClick={() => { setBookingType("daily"); setDuration(1); }}
                          className={`relative p-3 rounded-xl border-2 text-center transition-all ${bookingType === "daily" ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10" : "border-gray-200 hover:border-gray-300"}`}>
                          {bookingType === "daily" && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                          <div className="text-[10px] text-gray-500 font-medium">Daily</div>
                          <div className="text-sm font-bold text-emerald-700 mt-0.5">{fc(selectedRoom.price_per_day)}</div>
                        </button>
                      )}
                      {selectedRoom.price_per_month && (
                        <button onClick={() => { setBookingType("monthly"); setDuration(1); }}
                          className={`relative p-3 rounded-xl border-2 text-center transition-all ${bookingType === "monthly" ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10" : "border-gray-200 hover:border-gray-300"}`}>
                          {bookingType === "monthly" && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                          <div className="text-[10px] text-gray-500 font-medium">Monthly</div>
                          <div className="text-sm font-bold text-emerald-700 mt-0.5">{fc(selectedRoom.price_per_month)}</div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Step 2: Duration ── */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      2. Duration — {bookingType === "hourly" ? "Hours" : bookingType === "daily" ? "Days" : "Months"}
                    </label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 text-lg font-bold text-gray-600 transition">−</button>
                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-gray-800">{duration}</span>
                        <span className="text-sm text-gray-400 ml-1">{bookingType === "hourly" ? "hr" : bookingType === "daily" ? "day" : "mo"}{duration > 1 ? "s" : ""}</span>
                      </div>
                      <button onClick={() => setDuration(duration + 1)} className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 text-lg font-bold text-gray-600 transition">+</button>
                    </div>
                  </div>

                  {/* ── Step 3: Dates ── */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Dates</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Check-in</label>
                        <input type={bookingType === "hourly" ? "datetime-local" : "date"} value={checkIn} onChange={e => setCheckIn(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Check-out</label>
                        <input type={bookingType === "hourly" ? "datetime-local" : "date"} value={checkOut} onChange={e => setCheckOut(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50" />
                      </div>
                    </div>
                  </div>

                  {/* ── Step 4: Guests ── */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">4. Guests</label>
                    <select value={guests} onChange={e => setGuests(parseInt(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50">
                      {[...Array(Math.min(selectedRoom.available, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Step 5: Your Details ── */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">5. Your Details</label>
                    <div className="space-y-2.5">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <input type="text" placeholder="Full Name *" value={guestName} onChange={e => setGuestName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50" />
                      </div>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <input type="tel" placeholder="Phone Number *" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50" />
                      </div>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <input type="email" placeholder="Email (optional)" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-gray-50" />
                      </div>
                    </div>
                  </div>

                  {/* ── Special Requests ── */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">6. Special Requests <span className="text-gray-300 normal-case">(optional)</span></label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={2} placeholder="Any special requirements..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none bg-gray-50" />
                  </div>

                  {/* ── Price Breakdown (with real tax) ── */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price Breakdown</h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{fc(getUnitPrice())} × {duration} {bookingType === "hourly" ? "hr" : bookingType === "daily" ? "day" : "mo"}{duration > 1 ? "s" : ""}</span>
                        <span className="font-medium">{fc(getSubtotal())}</span>
                      </div>

                      {/* Tax items */}
                      {taxInfo.items.length > 0 ? (
                        taxInfo.items.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-gray-500">{item.name}</span>
                            <span className="font-medium">{fc(item.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tax</span>
                          <span className="text-gray-400 text-xs">{fc(0)}</span>
                        </div>
                      )}

                      {/* Advance Deposit */}
                      {advEnabled && advAmount > 0 && (
                        <div className="flex justify-between items-center bg-amber-50 -mx-2 px-2 py-2 rounded-lg">
                          <div>
                            <span className="text-amber-700 font-medium text-xs">💰 Advance Deposit</span>
                            {advPeriod > 0 && <p className="text-[10px] text-amber-600 mt-0.5">Covers {advPeriod} {advPeriodType}{advPeriod > 1 ? "s" : ""} · Adjusted at checkout</p>}
                          </div>
                          <span className="font-bold text-amber-800">{fc(advAmount)}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Estimated Total</span>
                        <span className="font-bold text-emerald-700 text-lg">{fc(taxInfo.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Submit ── */}
                  <button onClick={submitBooking} disabled={bookingLoading}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
                    {bookingLoading ? (
                      <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>
                    ) : (
                      <>Confirm Booking — {fc(taxInfo.grandTotal)}</>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center">By confirming, you agree to the booking terms and cancellation policy.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
