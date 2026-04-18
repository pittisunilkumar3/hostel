"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import StatCard from "@/app/components/StatCard";
import { getCurrentUser, apiFetch } from "@/lib/auth";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/owner/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: "My Rooms",
    href: "/owner/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    label: "Bookings",
    href: "/owner/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
  {
    label: "Customers",
    href: "/owner/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const available = rooms.filter(r => r.status === "AVAILABLE").length;
  const occupied = rooms.filter(r => r.status === "OCCUPIED").length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SINGLE: "bg-blue-100 text-blue-700",
      DOUBLE: "bg-violet-100 text-violet-700",
      TRIPLE: "bg-amber-100 text-amber-700",
      DORMITORY: "bg-rose-100 text-rose-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-700",
      OCCUPIED: "bg-red-100 text-red-700",
      MAINTENANCE: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardShell
      role="owner"
      title="Hostel Owner"
      items={sidebarItems}
      accentColor="text-emerald-300"
      accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950"
      hoverBg="bg-white/10"
    >
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || "Owner"}! 🏠</h1>
        <p className="text-gray-500 mt-1">Manage your hostel rooms and bookings here.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Rooms"
          value={rooms.length}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Available"
          value={available}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Occupied"
          value={occupied}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Capacity"
          value={`${totalCapacity} beds`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Room Grid */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">My Rooms</h3>
          <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            + Add Room
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
            {rooms.map((room) => (
              <div key={room.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">Room {room.room_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Floor</span>
                    <span className="font-medium">{room.floor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeColor(room.type)}`}>{room.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Occupancy</span>
                    <span className="font-medium">{room.current_occupancy}/{room.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-50">
                    <span className="text-gray-500">Price</span>
                    <span className="font-bold text-emerald-600">₹{room.price_per_month}/mo</span>
                  </div>
                </div>
                {/* Occupancy bar */}
                <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${room.current_occupancy >= room.capacity ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${(room.current_occupancy / room.capacity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
