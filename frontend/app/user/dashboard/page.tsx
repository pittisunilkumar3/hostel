"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import StatCard from "@/app/components/StatCard";
import { getCurrentUser, apiFetch } from "@/lib/auth";

const sidebarItems = [
  { label: "Dashboard", href: "/user/dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Bookings", href: "/user/bookings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { label: "Browse Rooms", href: "/user/rooms", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
  { label: "My Profile", href: "/user/profile", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

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
  description: string;
}

export default function UserDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getCurrentUser()); }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await apiFetch("/api/rooms/available");
        if (res.success) setRooms(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchRooms();
  }, []);

  const getTypeStyle = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: "bg-sky-50 text-sky-700 border-sky-200",
      DOUBLE: "bg-violet-50 text-violet-700 border-violet-200",
      TRIPLE: "bg-amber-50 text-amber-700 border-amber-200",
      DORMITORY: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[type] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <DashboardShell role="user" title="Customer" items={sidebarItems} accentColor="text-blue-300" accentBg="bg-gradient-to-b from-blue-900 to-blue-950" hoverBg="bg-white/10">
      {/* Welcome Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-10" />
        <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          <h1 className="text-2xl font-bold">Hello, {user?.name || "Customer"}! 😊</h1>
          <p className="text-blue-200 mt-1 text-sm">Find your perfect room and manage your bookings.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Available Rooms" value={rooms.length} subtitle="open for booking" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="My Bookings" value="0" subtitle="active bookings" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Starting From" value={rooms.length > 0 ? `₹${Math.min(...rooms.map(r => r.price_per_month))}` : "—"} subtitle="per month" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-amber-600" bgColor="bg-amber-50" />
        <StatCard title="Room Types" value={[...new Set(rooms.map(r => r.type))].length} subtitle="options available" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} color="text-violet-600" bgColor="bg-violet-50" />
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-600/20">
            {user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900">{user?.name || "Customer"}</h3>
            <p className="text-sm text-gray-400 truncate">{user?.email || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">📱 {user?.phone || "Phone not set"}</p>
          </div>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">👤 CUSTOMER</span>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Available Rooms</h3>
            <p className="text-xs text-gray-400 mt-0.5">Browse and book your ideal room</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-semibold">{rooms.length} rooms</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
            </div>
            <p className="text-gray-400 text-sm">No rooms available at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rooms.map((room) => {
              const occupancyPercent = room.capacity > 0 ? (room.current_occupancy / room.capacity) * 100 : 0;
              return (
                <div key={room.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-all group">
                  {/* Room Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                    <span className="text-[10px] opacity-70">Room</span>
                    <span className="font-bold text-sm">{room.room_number}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{room.type} Room</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${getTypeStyle(room.type)}`}>{room.type}</span>
                      <span className="text-[10px] text-gray-400">• Floor {room.floor}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{room.amenities || "Standard amenities"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400">{room.current_occupancy}/{room.capacity} occupied</span>
                      <div className="w-16 bg-gray-100 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${room.current_occupancy >= room.capacity ? "bg-red-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price + Action */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">₹{room.price_per_month}<span className="text-[10px] text-gray-400 font-normal">/mo</span></p>
                    <button className="mt-1.5 text-xs bg-blue-600 text-white px-4 py-1.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
