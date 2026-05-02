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
  advance_payment_enabled?: boolean;
  advance_payment_amount?: number;
  advance_payment_period?: number;
  advance_payment_period_type?: string;
  advance_payment_description?: string;
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

  // Image gallery
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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

  // Haversine distance
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

  // Get available pricing options for a room
  const getPricingOptions = (room: Room) => {
    const options: { type: string; label: string; price: number }[] = [];
    if (room.price_per_hour) options.push({ type: "hourly", label: "Hourly", price: room.price_per_hour });
    if (room.price_per_day) options.push({ type: "daily", label: "Daily", price: room.price_per_day });
    if (room.price_per_month) options.push({ type: "monthly", label: "Monthly", price: room.price_per_month });
    return options;
  };

  // Calculate booking total
  const calculateTotal = () => {
    if (!selectedRoom || !bookingType) return 0;
    const price = bookingType === "hourly" ? selectedRoom.price_per_hour
      : bookingType === "daily" ? selectedRoom.price_per_day
      : selectedRoom.price_per_month;
    return (price || 0) * duration;
  };

  // Open booking modal
  const openBooking = (room: Room) => {
    setSelectedRoom(room);
    const defaultType = room.pricing_type || "monthly";
    setBookingType(defaultType);
    setDuration(1);
    setGuests(1);
    setBookingSuccess(null);
    setBookingError("");
    // Pre-fill today's date
    const today = new Date().toISOString().slice(0, 16);
    setCheckIn(today);
    setCheckOut("");
    setBookingModal(true);
  };

  // Submit booking
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

  // Format room type label
  const roomTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: "Single", DOUBLE: "Double", TRIPLE: "Triple", QUAD: "Quad",
      DORMITORY: "Dormitory", FIVE_BED: "5-Bed", SIX_BED: "6-Bed",
    };
    return map[type] || type;
  };

  // Filtered rooms
  const filteredRooms = hostel?.rooms?.filter(r =>
    filterType === "all" || r.pricing_type === filterType
  ) || [];

  // Get unique pricing types from rooms
  const pricingTypes = hostel?.rooms
    ? [...new Set(hostel.rooms.map(r => r.pricing_type).filter(Boolean))]
    : [];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-emerald-700 to-teal-800">
        {hostel.cover_photo ? (
          <img src={hostel.cover_photo} alt={hostel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{hostel.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {hostel.address}
                  </span>
                  {hostel.zone_display_name && <span className="bg-white/20 px-2 py-0.5 rounded-full">{hostel.zone_display_name}</span>}
                  {distance && <span className="bg-emerald-500/80 px-2 py-0.5 rounded-full">{distance} km away</span>}
                </div>
              </div>
              {hostel.avg_rating && (
                <div className="bg-white rounded-xl px-3 py-2 text-center shadow-lg">
                  <div className="text-lg font-bold text-emerald-700">{hostel.avg_rating}</div>
                  <div className="text-xs text-gray-500">{hostel.total_reviews} reviews</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-emerald-600">{hostel.total_rooms}</div>
            <div className="text-xs text-gray-500 mt-1">Total Rooms</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-emerald-600">{hostel.total_beds}</div>
            <div className="text-xs text-gray-500 mt-1">Total Beds</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-emerald-600">{hostel.check_in_time || "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Check-in</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-emerald-600">{hostel.check_out_time || "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Check-out</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-3">About {hostel.name}</h2>
              <p className="text-gray-600 leading-relaxed">{hostel.description || "No description available."}</p>
              {hostel.phone && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <a href={`tel:${hostel.phone}`} className="hover:text-emerald-600">{hostel.phone}</a>
                </div>
              )}
            </div>

            {/* Amenities */}
            {hostel.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {hostel.amenities.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-sm text-emerald-800">
                      <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-xl font-bold text-gray-800">Available Rooms</h2>
                <div className="flex gap-2">
                  <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterType === "all" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
                  {pricingTypes.map(t => (
                    <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${filterType === t ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t}</button>
                  ))}
                </div>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  No rooms available for this filter
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRooms.map(room => (
                    <div key={room.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Room {room.room_number}</span>
                            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">{roomTypeLabel(room.type)}</span>
                            <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize">{room.pricing_type}</span>
                          </div>
                          {room.description && <p className="text-sm text-gray-600 mb-2">{room.description}</p>}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {room.capacity} Capacity
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              {room.available} Available
                            </span>
                            <span className="flex items-center gap-1">Floor {room.floor}</span>
                          </div>
                          {room.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {room.amenities.map((a, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{a}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 min-w-[180px]">
                          {/* Pricing badges */}
                          <div className="space-y-1 text-right">
                            {room.price_per_hour && (
                              <div className="text-sm"><span className="text-gray-400">Hourly:</span> <span className="font-semibold">{fc(room.price_per_hour || 0)}</span></div>
                            )}
                            {room.price_per_day && (
                              <div className="text-sm"><span className="text-gray-400">Daily:</span> <span className="font-semibold">{fc(room.price_per_day || 0)}</span></div>
                            )}
                            {room.price_per_month && (
                              <div className="text-sm"><span className="text-gray-400">Monthly:</span> <span className="font-bold text-emerald-700">{fc(room.price_per_month || 0)}</span></div>
                            )}
                          </div>
                          <button
                            onClick={() => openBooking(room)}
                            disabled={room.available <= 0}
                            className="w-full px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {room.available > 0 ? "Book Now" : "Fully Booked"}
                          </button>
                          {hostel.advance_payment_enabled && hostel.advance_payment_amount > 0 && (
                            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 text-center">
                              <span className="font-semibold">{fc(hostel.advance_payment_amount)}</span> advance deposit required
                              {hostel.advance_payment_period && (
                                <> for {hostel.advance_payment_period} {hostel.advance_payment_period_type}{(hostel.advance_payment_period || 0) > 1 ? "s" : ""}</>
                              )}
                            </div>
                          )}
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews ({hostel.total_reviews})</h2>
                <div className="space-y-4">
                  {hostel.reviews.map((rev: any) => (
                    <div key={rev.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                          {rev.user_name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{rev.user_name}</div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(rev.rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                            <span className="text-xs text-gray-400 ml-1">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {rev.comment && <p className="text-sm text-gray-600 ml-11">{rev.comment}</p>}
                      {rev.reply && (
                        <div className="ml-11 mt-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                          <span className="font-semibold text-emerald-700">Owner Reply:</span> {rev.reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">Contact Info</h3>
              <div className="space-y-3">
                <a href={`tel:${hostel.phone}`} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl text-emerald-700 font-semibold hover:bg-emerald-100 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call {hostel.phone}
                </a>
                {hostel.email && (
                  <a href={`mailto:${hostel.email}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-700 font-semibold hover:bg-blue-100 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Send Email
                  </a>
                )}
                {hostel.address && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl text-gray-600 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {hostel.address}
                  </div>
                )}
              </div>

              {/* Quick Booking Summary */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">Quick Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Rooms Available</span><span className="font-semibold">{hostel.rooms?.filter(r => r.available > 0).length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Starting from</span><span className="font-bold text-emerald-700">
                    {fc(Math.min(...(hostel.rooms?.flatMap(r => [r.price_per_hour, r.price_per_day, r.price_per_month].filter((p): p is number => p !== null)) || [0])))}
                  </span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Booking Types</span><span className="font-semibold capitalize">{[...new Set(hostel.rooms?.map(r => r.pricing_type))].join(", ")}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ BOOKING MODAL ============ */}
      {bookingModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBookingModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {bookingSuccess ? (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-500 mb-6">Your booking has been placed successfully.</p>
                <div className="bg-gray-50 rounded-xl p-5 text-left space-y-2 text-sm mb-6">
                  <div className="flex justify-between"><span className="text-gray-500">Booking ID</span><span className="font-bold">#{bookingSuccess.booking_id}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-semibold">{selectedRoom.room_number} ({roomTypeLabel(selectedRoom.type)})</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-semibold capitalize">{bookingSuccess.booking_type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{bookingSuccess.duration} {bookingSuccess.booking_type === "hourly" ? "hour(s)" : bookingSuccess.booking_type === "daily" ? "day(s)" : "month(s)"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-emerald-700">{fc(bookingSuccess.total_amount)}</span></div>
                  {bookingSuccess.advance_payment && (
                    <div className="flex justify-between border-t pt-2 mt-1"><span className="text-amber-600">Advance Deposit</span><span className="font-bold text-amber-700">{fc(bookingSuccess.advance_payment.amount)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold text-yellow-600">Pending Confirmation</span></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setBookingModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Close</button>
                  <button onClick={() => router.push("/")} className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700">Back to Home</button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Book Room {selectedRoom.room_number}</h3>
                  <button onClick={() => setBookingModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Room Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">{roomTypeLabel(selectedRoom.type)}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Floor {selectedRoom.floor}</span>
                    <span className="text-xs text-gray-500">{selectedRoom.capacity} capacity • {selectedRoom.available} available</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{bookingError}</div>
                )}

                {/* Booking Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRoom.price_per_hour && (
                      <button onClick={() => { setBookingType("hourly"); setDuration(1); }}
                        className={`p-3 rounded-xl border-2 text-center transition ${bookingType === "hourly" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="text-xs text-gray-500">Hourly</div>
                        <div className="font-bold text-emerald-700">{fc(selectedRoom.price_per_hour || 0)}</div>
                      </button>
                    )}
                    {selectedRoom.price_per_day && (
                      <button onClick={() => { setBookingType("daily"); setDuration(1); }}
                        className={`p-3 rounded-xl border-2 text-center transition ${bookingType === "daily" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="text-xs text-gray-500">Daily</div>
                        <div className="font-bold text-emerald-700">{fc(selectedRoom.price_per_day || 0)}</div>
                      </button>
                    )}
                    {selectedRoom.price_per_month && (
                      <button onClick={() => { setBookingType("monthly"); setDuration(1); }}
                        className={`p-3 rounded-xl border-2 text-center transition ${bookingType === "monthly" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="text-xs text-gray-500">Monthly</div>
                        <div className="font-bold text-emerald-700">{fc(selectedRoom.price_per_month || 0)}</div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration ({bookingType === "hourly" ? "Hours" : bookingType === "daily" ? "Days" : "Months"})
                  </label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 text-lg font-bold">−</button>
                    <input type="number" value={duration} onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 text-center border border-gray-200 rounded-lg py-2 font-semibold" min="1" />
                    <button onClick={() => setDuration(duration + 1)} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 text-lg font-bold">+</button>
                  </div>
                </div>

                {/* Check-in / Check-out */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in</label>
                    <input type={bookingType === "hourly" ? "datetime-local" : "date"} value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out {bookingType === "monthly" ? "" : "*"}</label>
                    <input type={bookingType === "hourly" ? "datetime-local" : "date"} value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                  </div>
                </div>

                {/* Guests */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Guests</label>
                  <select value={guests} onChange={e => setGuests(parseInt(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400">
                    {[...Array(Math.min(selectedRoom.available, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Guest Details */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Details</label>
                  <div className="space-y-3">
                    <input type="text" placeholder="Full Name *" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                    <input type="tel" placeholder="Phone Number *" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                    <input type="email" placeholder="Email (optional)" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                  </div>
                </div>

                {/* Special Requests */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests (optional)</label>
                  <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={2} placeholder="Any special requirements..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none" />
                </div>

                {/* Price Summary */}
                <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Unit Price</span><span className="font-semibold">{fc(bookingType === "hourly" ? (selectedRoom.price_per_hour || 0) : bookingType === "daily" ? (selectedRoom.price_per_day || 0) : (selectedRoom.price_per_month || 0))} × {duration}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{fc(calculateTotal())}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Taxes</span><span className="font-semibold">Calculated at checkout</span></div>
                    <div className="border-t border-emerald-200 pt-2 flex justify-between"><span className="font-bold text-gray-800">Estimated Total</span><span className="font-bold text-emerald-700 text-lg">{fc(calculateTotal())}</span></div>
                    {hostel?.advance_payment_enabled && hostel?.advance_payment_amount > 0 && (
                      <div className="border-t border-amber-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-amber-700 font-medium">Advance Deposit Required</span>
                          <span className="font-bold text-amber-700">{fc(hostel.advance_payment_amount)}</span>
                        </div>
                        {hostel.advance_payment_period && (
                          <p className="text-xs text-amber-600 mt-1">Covers {hostel.advance_payment_period} {hostel.advance_payment_period_type}{(hostel.advance_payment_period || 0) > 1 ? "s" : ""} • Adjusted at checkout</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <button onClick={submitBooking} disabled={bookingLoading} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {bookingLoading ? (
                    <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Processing...</>
                  ) : (
                    <>Confirm Booking — {fc(calculateTotal())}</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
