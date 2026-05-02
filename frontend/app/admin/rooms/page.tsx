"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

// ── Types ──
interface Room {
  id: number;
  hostel_id: number;
  floor_id: number;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  type: string;
  status: string;
  pricing_type: string;
  price_per_month: number | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  amenities: string[];
  furnishing: string[];
  dimensions: { length: number; width: number; area: number } | null;
  description: string | null;
  images: string[];
  is_active: boolean;
  hostel_name: string;
  floor_name: string;
  floor_number: number;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  created_at: string;
  updated_at: string;
}

interface Hostel {
  id: number;
  name: string;
  owner_name: string;
}

interface Floor {
  id: number;
  hostel_id: number;
  floor_name: string;
  floor_number: number;
}

export default function AdminRoomsPage() {
  // ── State ──
  const [rooms, setRooms] = useState<Room[]>([]);
  const { fc, symbol } = useCurrency();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  });

  // Color theme - using purple to match super admin panel
  const colors = {
    primary: 'purple',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    iconHover: 'hover:bg-purple-100',
    focusRing: 'focus:ring-purple-500/20',
    focusBorder: 'focus:border-purple-400',
    btnBg: 'bg-purple-600',
    btnHover: 'hover:bg-purple-700',
    btnShadow: 'shadow-purple-600/20',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-600',
    bgLight: 'bg-purple-50',
    textLight: 'text-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-700',
  };

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    is_active: true,
  });

  // ── Fetch Data ──
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (hostelFilter !== "all") params.set("hostel_id", hostelFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await apiFetch(`/api/admin/rooms?${params}`);
      if (res.success) {
        const data = res.data;
        setRooms(data?.rooms || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);

        // Calculate stats from current data
        const allRooms = data?.rooms || [];
        setStats({
          total: data?.total || 0,
          available: allRooms.filter((r: Room) => r.status === "AVAILABLE").length,
          occupied: allRooms.filter((r: Room) => r.status === "OCCUPIED").length,
          maintenance: allRooms.filter((r: Room) => r.status === "MAINTENANCE").length,
        });
      }
    } catch (e) {
      console.error("Failed to fetch rooms", e);
    } finally {
      setLoading(false);
    }
  }, [page, search, hostelFilter, statusFilter, typeFilter]);

  const fetchHostels = async () => {
    try {
      const res = await apiFetch("/api/hostels");
      if (res.success) {
        const data = res.data?.data || res.data || [];
        setHostels(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  };

  const fetchFloors = async (hostelId: string) => {
    if (hostelId === "all") {
      setFloors([]);
      return;
    }
    try {
      const res = await apiFetch(`/api/owner/floors?hostel_id=${hostelId}`);
      if (res.success) setFloors(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchHostels(); }, []);
  useEffect(() => { fetchRooms(); }, [fetchRooms]);
  useEffect(() => { fetchFloors(hostelFilter); }, [hostelFilter]);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ── Actions ──
  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      const res = await apiFetch("/api/admin/rooms", {
        method: "PUT",
        body: JSON.stringify({
          id: editingRoom.id,
          status: editForm.status,
          is_active: editForm.is_active,
        }),
      });

      if (res.success) {
        setMessage({ type: "success", text: "Room updated successfully" });
        setShowEditDialog(false);
        setEditingRoom(null);
        fetchRooms();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update room" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to update room" });
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;

    try {
      const res = await apiFetch(`/api/admin/rooms?id=${roomId}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "Room deleted successfully" });
        fetchRooms();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to delete room" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to delete room" });
    }
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setEditForm({
      status: room.status,
      is_active: room.is_active,
    });
    setShowEditDialog(true);
  };

  // ── Helpers ──
  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "OCCUPIED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "MAINTENANCE": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SINGLE': 'Single (1 Bed)',
      'DOUBLE': 'Double (2 Beds)',
      'TRIPLE': 'Triple (3 Beds)',
      'QUAD': 'Quad (4 Beds)',
      'FIVE_BED': '5 Bed',
      'SIX_BED': '6 Bed',
      'SEVEN_BED': '7 Bed',
      'EIGHT_BED': '8 Bed',
      'NINE_BED': '9 Bed',
      'TEN_BED': '10 Bed',
      'DORMITORY': 'Dormitory'
    };
    return labels[type] || type;
  };

  const getPrice = (room: Room) => {
    if (room.pricing_type === "hourly") return `${fc(room.price_per_hour || 0)}/hr`;
    if (room.pricing_type === "daily") return `${fc(room.price_per_day || 0)}/day`;
    return `${fc(room.price_per_month || 0)}/mo`;
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${
          message.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {message.type === "success" ? "✅ " : "❌ "}{message.text}
        </div>
      )}

      {/* Page Header — mirrors reference vendor/list.blade.php page-header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
            <p className="text-gray-500 text-sm">Manage all rooms across all hostels</p>
          </div>
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{stats.total}</span>
        </div>
      </div>

      {/* Stats Cards — mirrors reference resturant-card wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-purple-100 text-sm mt-1">Total Rooms</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-purple-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.available}</p>
            <p className="text-green-100 text-sm mt-1">Available</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-green-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.occupied}</p>
            <p className="text-blue-100 text-sm mt-1">Occupied</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-blue-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-3xl font-bold">{stats.maintenance}</p>
            <p className="text-amber-100 text-sm mt-1">Maintenance</p>
          </div>
          <svg className="absolute right-3 bottom-3 w-12 h-12 text-amber-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search rooms or hostels..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
          </div>

          {/* Hostel Filter */}
          <div>
            <select
              value={hostelFilter}
              onChange={(e) => { setHostelFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            >
              <option value="all">All Hostels</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            >
              <option value="all">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            >
              <option value="all">All Types</option>
              <option value="SINGLE">Single (1 Bed)</option>
              <option value="DOUBLE">Double (2 Beds)</option>
              <option value="TRIPLE">Triple (3 Beds)</option>
              <option value="QUAD">Quad (4 Beds)</option>
              <option value="FIVE_BED">5 Bed</option>
              <option value="SIX_BED">6 Bed</option>
              <option value="SEVEN_BED">7 Bed</option>
              <option value="EIGHT_BED">8 Bed</option>
              <option value="NINE_BED">9 Bed</option>
              <option value="TEN_BED">10 Bed</option>
              <option value="DORMITORY">Dormitory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rooms Found</h3>
            <p className="text-gray-400">No rooms match your current filters</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Floor</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      {/* Room Number */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-sm">{room.room_number.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{room.room_number}</p>
                            <p className="text-xs text-gray-400">ID: {room.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Hostel */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{room.hostel_name || "N/A"}</p>
                      </td>

                      {/* Floor */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{room.floor_name || `Floor ${room.floor}`}</p>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {getRoomTypeLabel(room.type)}
                        </span>
                      </td>

                      {/* Capacity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {Array.from({ length: Math.min(room.capacity, 3) }).map((_, i) => (
                              <div key={i} className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {room.current_occupancy}/{room.capacity}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-emerald-600">{getPrice(room)}</p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(room.status)}`}>
                          {room.status.charAt(0) + room.status.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{room.owner_name || "N/A"}</p>
                        <p className="text-xs text-gray-400">{room.owner_email}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(room)}
                            className="p-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Edit Room"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            disabled={room.current_occupancy > 0}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Room"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} rooms
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          page === pageNum
                            ? "bg-purple-600 text-white"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      {showEditDialog && editingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Room</h2>
                <button onClick={() => { setShowEditDialog(false); setEditingRoom(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Room Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-purple-600 font-bold">{editingRoom.room_number.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{editingRoom.room_number}</p>
                    <p className="text-xs text-gray-500">{editingRoom.hostel_name} • {editingRoom.floor_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-700">{getRoomTypeLabel(editingRoom.type)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Capacity:</span>
                    <span className="ml-2 text-gray-700">{editingRoom.capacity} beds</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Active</p>
                  <p className="text-sm text-gray-500">Room is visible and bookable</p>
                </div>
                <button
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.is_active ? "bg-purple-600" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editForm.is_active ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowEditDialog(false); setEditingRoom(null); }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRoom}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
                >
                  Update Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
