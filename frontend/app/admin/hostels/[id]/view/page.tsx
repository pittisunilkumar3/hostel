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
  amenities: string[];
  owner_f_name: string;
  owner_l_name: string;
  owner_phone: string;
  owner_email: string;
  status: number;
  rating: number;
  created_at: string;
}

export default function ViewHostelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hostel, setHostel] = useState<HostelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const res = await apiFetch(`/api/hostels/${id}`);
        if (res.success) {
          setHostel(res.data);
        } else {
          setMessage({ type: "error", text: "Failed to load hostel data" });
        }
      } catch {
        setMessage({ type: "error", text: "Network error" });
      } finally {
        setLoading(false);
      }
    };
    fetchHostel();
  }, [id]);

  const toggleStatus = async () => {
    if (!hostel) return;
    try {
      const res = await apiFetch(`/api/hostels/${hostel.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: hostel.status === 1 ? 0 : 1 }),
      });
      if (res.success) {
        setHostel({ ...hostel, status: hostel.status === 1 ? 0 : 1 });
        setMessage({ type: "success", text: "✅ Status updated!" });
      }
    } catch { /* ignore */ }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
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
          <p className="text-gray-400">Hostel not found</p>
          <button onClick={() => router.push("/admin/hostels")} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm">Back to List</button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/hostels")} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{hostel.name}</h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            hostel.status === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {hostel.status === 1 ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleStatus}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              hostel.status === 1 ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}>
            {hostel.status === 1 ? "Deactivate" : "Activate"}
          </button>
          <button onClick={() => router.push(`/admin/hostels/${hostel.id}/edit`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Hostel
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Cover Photo */}
      {hostel.cover_photo && (
        <div className="mb-6 rounded-2xl overflow-hidden h-48 lg:h-64">
          <img src={hostel.cover_photo} alt={hostel.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1 space-y-5">
          {/* Hostel Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-100 shrink-0">
                {hostel.logo ? (
                  <img src={hostel.logo} alt={hostel.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold">
                    {hostel.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{hostel.name}</h3>
                <p className="text-sm text-gray-400">{hostel.address}</p>
              </div>
            </div>
            <div className="p-6">
              {hostel.description && (
                <p className="text-sm text-gray-600 mb-4">{hostel.description}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-700">{hostel.total_rooms || 0}</p>
                  <p className="text-xs text-purple-500 mt-1">Rooms</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-700">{hostel.total_beds || 0}</p>
                  <p className="text-xs text-blue-500 mt-1">Beds</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-2xl font-bold text-yellow-700">{hostel.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                  <p className="text-xs text-yellow-500 mt-1">Rating</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-700">{hostel.minimum_stay || 1}</p>
                  <p className="text-xs text-green-500 mt-1">Min Stay (days)</p>
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
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-700">{hostel.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-700">{hostel.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Address</p>
                    <p className="text-sm font-medium text-gray-700">{hostel.address || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {hostel.amenities && hostel.amenities.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-base font-bold text-gray-900">Amenities</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {hostel.amenities.map((a) => (
                    <span key={a} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">{a}</span>
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
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  {hostel.owner_f_name?.[0]?.toUpperCase() || "?"}{hostel.owner_l_name?.[0]?.toUpperCase() || ""}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{hostel.owner_f_name} {hostel.owner_l_name}</p>
                  <p className="text-xs text-gray-400">Owner</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-gray-600">{hostel.owner_phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
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
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{hostel.zone_name || "—"}</p>
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
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Check-in</span>
                <span className="text-sm font-medium text-gray-700">{hostel.check_in_time || "14:00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Check-out</span>
                <span className="text-sm font-medium text-gray-700">{hostel.check_out_time || "11:00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Minimum Stay</span>
                <span className="text-sm font-medium text-gray-700">{hostel.minimum_stay || 1} day(s)</span>
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
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm text-gray-600">{hostel.latitude}, {hostel.longitude}</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-all"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Joined */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-500">Joined {formatDate(hostel.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
