"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import StatCard from "@/app/components/StatCard";
import { getCurrentUser, apiFetch } from "@/lib/auth";

const sidebarItems = [
  { label: "Dashboard", href: "/owner/dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: "My Rooms", href: "/owner/rooms", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { label: "Bookings", href: "/owner/bookings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { label: "Customers", href: "/owner/customers", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
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
}

export default function OwnerDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getCurrentUser()); }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await apiFetch("/api/rooms?page=1&limit=10");
        if (res.success) setRooms(res.data.rooms || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchRooms();
  }, []);

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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Rooms" value={rooms.length} subtitle="all rooms" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Available" value={available} subtitle="ready to book" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Occupied" value={occupied} subtitle="currently filled" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>} color="text-sky-600" bgColor="bg-sky-50" />
        <StatCard title="Total Capacity" value={`${totalCapacity} beds`} subtitle="across all rooms" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} color="text-amber-600" bgColor="bg-amber-50" />
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
                    <span className="text-lg font-bold text-emerald-600">₹{room.price_per_month}<span className="text-[10px] text-gray-400 font-normal">/mo</span></span>
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
    </DashboardShell>
  );
}
