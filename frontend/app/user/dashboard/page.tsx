"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import StatCard from "@/app/components/StatCard";
import { getCurrentUser, apiFetch } from "@/lib/auth";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/user/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: "My Bookings",
    href: "/user/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
  {
    label: "Browse Rooms",
    href: "/user/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  },
  {
    label: "My Profile",
    href: "/user/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SINGLE: "bg-blue-100 text-blue-700 border-blue-200",
      DOUBLE: "bg-violet-100 text-violet-700 border-violet-200",
      TRIPLE: "bg-amber-100 text-amber-700 border-amber-200",
      DORMITORY: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardShell
      role="user"
      title="Customer"
      items={sidebarItems}
      accentColor="text-blue-300"
      accentBg="bg-gradient-to-b from-blue-900 to-blue-950"
      hoverBg="bg-white/10"
    >
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name || "Customer"}! 😊</h1>
        <p className="text-gray-500 mt-1">Find your perfect room and manage your bookings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Available Rooms"
          value={rooms.length}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="My Bookings"
          value="0"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Starting From"
          value={rooms.length > 0 ? `₹${Math.min(...rooms.map(r => r.price_per_month))}` : "—"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Room Types"
          value={[...new Set(rooms.map(r => r.type))].length}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold">
            {user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{user?.name || "Customer"}</h3>
            <p className="text-sm text-gray-500">{user?.email || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Phone: {user?.phone || "Not set"}</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">CUSTOMER</span>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Available Rooms</h3>
          <span className="text-xs text-gray-400">{rooms.length} rooms available</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No rooms available at the moment.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rooms.map((room) => (
              <div key={room.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-xs text-gray-400">Room</span>
                  <span className="font-bold text-gray-900">{room.room_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{room.type} Room</span>
                    <span className="text-xs text-gray-400">• Floor {room.floor}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{room.amenities || "Standard amenities"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{room.current_occupancy}/{room.capacity} occupied</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{room.price_per_month}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                  <button className="mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
