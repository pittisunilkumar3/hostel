"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";

const sidebarItems = getSidebarItems();

// ── Types ──
interface Floor {
  id: number;
  hostel_id: number;
  floor_number: number;
  floor_name: string;
  description: string | null;
  amenities: string[];
  is_active: boolean;
  room_count: number;
  total_beds: number;
  occupied_beds: number;
}

interface Room {
  id: number;
  hostel_id: number;
  floor_id: number;
  room_number: string;
  type: string;
  capacity: number;
  current_occupancy: number;
  pricing_type: string;
  price_per_month: number | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  custom_pricing: any;
  status: string;
  amenities: string[];
  furnishing: string[];
  dimensions: { length: number; width: number; area: number } | null;
  description: string | null;
  images: string[];
  is_active: boolean;
  floor_name: string;
  floor_number: number;
  hostel_name: string;
}

const floorAmenities = [
  "Reception", "Common Room", "Study Room", "Laundry Room", "Dining Area",
  "Lounge", "Cafeteria", "Gym", "Library", "TV Room", "Gaming Zone",
  "Meeting Room", "Prayer Room", "Medical Room", "Storage Room"
];

const roomAmenities = [
  "AC", "Heating", "Attached Bathroom", "Shared Bathroom", "Balcony",
  "Study Table", "Chair", "Wardrobe", "Bookshelf", "Mini Fridge",
  "TV", "WiFi", "Fan", "Window", "Curtains"
];

const furnishingOptions = [
  "Bed", "Mattress", "Pillow", "Bedsheet", "Study Table", "Chair",
  "Wardrobe", "Bookshelf", "Mirror", "Dustbin", "Sofa", "Side Table"
];

export default function FloorRoomManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── State ──
  const [hostelId, setHostelId] = useState<number | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<"floors" | "rooms">("floors");
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Floor dialog state
  const [showFloorDialog, setShowFloorDialog] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorForm, setFloorForm] = useState({
    floor_number: "",
    floor_name: "",
    description: "",
    amenities: [] as string[]
  });

  // Room dialog state
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    floor_id: "",
    room_number: "",
    room_type: "SINGLE",
    capacity: "1",
    pricing_type: "monthly",
    price_per_month: "",
    price_per_hour: "",
    price_per_day: "",
    custom_pricing: { min_hours: "", max_hours: "", price_per_hour: "" },
    amenities: [] as string[],
    furnishing: [] as string[],
    dimensions: { length: "", width: "", area: "" },
    description: ""
  });

  // ── Init ──
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.push("/login/owner");
      return;
    }
    setUser(u);
    fetchHostels();
  }, [router]);

  // ── Fetch when hostel changes ──
  useEffect(() => {
    if (hostelId) {
      fetchFloors();
      fetchRooms();
    }
  }, [hostelId]);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchHostels = async () => {
    try {
      const res = await apiFetch("/api/hostels/owner/my-hostels");
      if (res.success && res.data?.length > 0) {
        setHostelId(res.data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch hostels", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async () => {
    if (!hostelId) return;
    try {
      setFetching(true);
      const res = await apiFetch(`/api/owner/floors?hostel_id=${hostelId}`);
      if (res.success) setFloors(res.data || []);
    } catch (e) {
      console.error("Failed to fetch floors", e);
    } finally {
      setFetching(false);
    }
  };

  const fetchRooms = async () => {
    if (!hostelId) return;
    try {
      const res = await apiFetch(`/api/owner/rooms?hostel_id=${hostelId}`);
      if (res.success) setRooms(res.data || []);
    } catch (e) {
      console.error("Failed to fetch rooms", e);
    }
  };

  // ── Floor CRUD ──
  const handleFloorSubmit = async () => {
    if (!hostelId || floorForm.floor_number === "" || !floorForm.floor_name) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    try {
      const payload = {
        hostel_id: hostelId,
        floor_number: parseInt(floorForm.floor_number),
        floor_name: floorForm.floor_name,
        description: floorForm.description || null,
        amenities: floorForm.amenities.length > 0 ? floorForm.amenities : null
      };

      const res = editingFloor
        ? await apiFetch(`/api/owner/floors/${editingFloor.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiFetch("/api/owner/floors", { method: "POST", body: JSON.stringify(payload) });

      if (res.success) {
        setMessage({ type: "success", text: `Floor ${editingFloor ? "updated" : "created"} successfully` });
        setShowFloorDialog(false);
        resetFloorForm();
        fetchFloors();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save floor" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to save floor" });
    }
  };

  const handleDeleteFloor = async (floorId: number) => {
    if (!confirm("Are you sure you want to delete this floor? This will fail if the floor has rooms.")) return;

    try {
      const res = await apiFetch(`/api/owner/floors/${floorId}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "Floor deleted successfully" });
        fetchFloors();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to delete floor" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to delete floor" });
    }
  };

  const resetFloorForm = () => {
    setFloorForm({ floor_number: "", floor_name: "", description: "", amenities: [] });
    setEditingFloor(null);
  };

  const openEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    setFloorForm({
      floor_number: floor.floor_number.toString(),
      floor_name: floor.floor_name,
      description: floor.description || "",
      amenities: floor.amenities || []
    });
    setShowFloorDialog(true);
  };

  // ── Room CRUD ──
  const handleRoomSubmit = async () => {
    if (!hostelId || !roomForm.floor_id || !roomForm.room_number) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    // Validate price based on pricing type
    if (roomForm.pricing_type === "monthly" && !roomForm.price_per_month) {
      setMessage({ type: "error", text: "Please enter price per month" });
      return;
    }
    if (roomForm.pricing_type === "hourly" && !roomForm.price_per_hour) {
      setMessage({ type: "error", text: "Please enter price per hour" });
      return;
    }
    if (roomForm.pricing_type === "daily" && !roomForm.price_per_day) {
      setMessage({ type: "error", text: "Please enter price per day" });
      return;
    }

    try {
      const payload = {
        hostel_id: hostelId,
        floor_id: parseInt(roomForm.floor_id),
        room_number: roomForm.room_number,
        room_type: roomForm.room_type,
        capacity: parseInt(roomForm.capacity),
        pricing_type: roomForm.pricing_type,
        price_per_month: roomForm.price_per_month ? parseFloat(roomForm.price_per_month) : null,
        price_per_hour: roomForm.price_per_hour ? parseFloat(roomForm.price_per_hour) : null,
        price_per_day: roomForm.price_per_day ? parseFloat(roomForm.price_per_day) : null,
        custom_pricing: roomForm.pricing_type === "custom" ? roomForm.custom_pricing : null,
        amenities: roomForm.amenities.length > 0 ? roomForm.amenities : null,
        furnishing: roomForm.furnishing.length > 0 ? roomForm.furnishing : null,
        dimensions: roomForm.dimensions.length ? {
          length: parseFloat(roomForm.dimensions.length),
          width: parseFloat(roomForm.dimensions.width),
          area: parseFloat(roomForm.dimensions.area) || (parseFloat(roomForm.dimensions.length) * parseFloat(roomForm.dimensions.width))
        } : null,
        description: roomForm.description || null
      };

      const res = editingRoom
        ? await apiFetch(`/api/owner/rooms/${editingRoom.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiFetch("/api/owner/rooms", { method: "POST", body: JSON.stringify(payload) });

      if (res.success) {
        setMessage({ type: "success", text: `Room ${editingRoom ? "updated" : "created"} successfully` });
        setShowRoomDialog(false);
        resetRoomForm();
        fetchRooms();
        fetchFloors();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to save room" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to save room" });
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const res = await apiFetch(`/api/owner/rooms/${roomId}`, { method: "DELETE" });
      if (res.success) {
        setMessage({ type: "success", text: "Room deleted successfully" });
        fetchRooms();
        fetchFloors();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to delete room" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to delete room" });
    }
  };

  const handleUpdateRoom = async (roomId: number, updates: any) => {
    try {
      const res = await apiFetch(`/api/owner/rooms/${roomId}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      if (res.success) {
        setMessage({ type: "success", text: "Room updated successfully" });
        fetchRooms();
        fetchFloors();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update room" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to update room" });
    }
  };

  const resetRoomForm = () => {
    setRoomForm({
      floor_id: "", room_number: "", room_type: "SINGLE", capacity: "1",
      pricing_type: "monthly", price_per_month: "", price_per_hour: "", price_per_day: "",
      custom_pricing: { min_hours: "", max_hours: "", price_per_hour: "" },
      amenities: [], furnishing: [],
      dimensions: { length: "", width: "", area: "" }, description: ""
    });
    setEditingRoom(null);
  };

  const openEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      floor_id: room.floor_id.toString(),
      room_number: room.room_number,
      room_type: room.type,
      capacity: room.capacity.toString(),
      pricing_type: room.pricing_type || "monthly",
      price_per_month: room.price_per_month?.toString() || "",
      price_per_hour: room.price_per_hour?.toString() || "",
      price_per_day: room.price_per_day?.toString() || "",
      custom_pricing: room.custom_pricing || { min_hours: "", max_hours: "", price_per_hour: "" },
      amenities: room.amenities || [],
      furnishing: room.furnishing || [],
      dimensions: room.dimensions
        ? { length: room.dimensions.length.toString(), width: room.dimensions.width.toString(), area: room.dimensions.area.toString() }
        : { length: "", width: "", area: "" },
      description: room.description || ""
    });
    setShowRoomDialog(true);
  };

  // ── Helpers ──
  const getFloorsForRoom = () => floors.filter(f => f.is_active);
  const getRoomsByFloor = (floorId: number) => rooms.filter(r => r.floor_id === floorId);

  const getOccupancyRate = () => {
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.current_occupancy, 0);
    return totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "OCCUPIED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "MAINTENANCE": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </DashboardShell>
    );
  }

  // ── No hostels ──
  if (!loading && !hostelId) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Hostel Found</h2>
          <p className="text-gray-500 mb-6">You need to register and get approved before managing floors and rooms.</p>
          <button onClick={() => router.push("/owner/register-hostel")} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Register Hostel
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${
          message.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {message.type === "success" ? "✅ " : "❌ "}{message.text}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Floor & Room Management</h1>
        <p className="text-gray-500 mt-1">Organize your hostel with floors and rooms</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Floors</p>
              <p className="text-2xl font-bold text-gray-900">{floors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Beds</p>
              <p className="text-2xl font-bold text-gray-900">{rooms.reduce((sum, r) => sum + r.capacity, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{getOccupancyRate()}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("floors")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "floors"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Floors ({floors.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "rooms"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Rooms ({rooms.length})
            </span>
          </button>
        </div>

        {/* Floors Tab */}
        {activeTab === "floors" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Floor Management</h2>
              <button
                onClick={() => { resetFloorForm(); setShowFloorDialog(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Floor
              </button>
            </div>

            {fetching ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading floors...</p>
              </div>
            ) : floors.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Floors Added</h3>
                <p className="text-gray-400 mb-4">Start by adding floors to organize your hostel</p>
                <button
                  onClick={() => { resetFloorForm(); setShowFloorDialog(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add First Floor
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {floors.map(floor => (
                  <div key={floor.id} className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    {/* Floor Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{floor.floor_name}</h3>
                          <p className="text-emerald-100 text-sm">Floor {floor.floor_number}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{floor.floor_number}</span>
                        </div>
                      </div>
                    </div>

                    {/* Floor Content */}
                    <div className="p-4 space-y-3">
                      {floor.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{floor.description}</p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Rooms</p>
                          <p className="text-lg font-bold text-gray-900">{floor.room_count}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Beds</p>
                          <p className="text-lg font-bold text-gray-900">{floor.total_beds}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Occupied</p>
                          <p className="text-lg font-bold text-gray-900">{floor.occupied_beds}</p>
                        </div>
                      </div>

                      {/* Amenities */}
                      {floor.amenities && floor.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {floor.amenities.slice(0, 3).map(a => (
                            <span key={a} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-medium">{a}</span>
                          ))}
                          {floor.amenities.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{floor.amenities.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => openEditFloor(floor)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFloor(floor.id)}
                          disabled={floor.room_count > 0}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Room Management</h2>
              <button
                onClick={() => { resetRoomForm(); setShowRoomDialog(true); }}
                disabled={floors.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Room
              </button>
            </div>

            {floors.length === 0 ? (
              <div className="text-center py-12 bg-amber-50 rounded-xl border border-amber-200">
                <svg className="w-12 h-12 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold text-amber-800 mb-2">Add Floors First</h3>
                <p className="text-amber-600">You need to add floors before you can create rooms.</p>
              </div>
            ) : fetching ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rooms Added</h3>
                <p className="text-gray-400 mb-4">Add rooms to your floors to start accepting guests</p>
                <button
                  onClick={() => { resetRoomForm(); setShowRoomDialog(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
                >
                  Add First Room
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {floors.map(floor => {
                  const floorRooms = getRoomsByFloor(floor.id);
                  if (floorRooms.length === 0) return null;

                  return (
                    <div key={floor.id} className="space-y-3">
                      {/* Floor Header */}
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="text-emerald-600 font-bold text-sm">{floor.floor_number}</span>
                        </div>
                        <h3 className="font-bold text-gray-900">{floor.floor_name}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {floorRooms.length} room{floorRooms.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Room Cards */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {floorRooms.map(room => (
                          <div key={room.id} className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900">{room.room_number}</h4>
                                  <p className="text-sm text-gray-400">
                                    {room.type.charAt(0) + room.type.slice(1).toLowerCase()} • {room.capacity > 1 ? room.capacity + ' beds' : 'bed'}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(room.status)}`}>
                                  {room.status.charAt(0) + room.status.slice(1).toLowerCase()}
                                </span>
                              </div>

                              {/* Price */}
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 mb-3">
                                <p className="text-xs text-gray-400 font-medium">
                                  {room.pricing_type === 'hourly' ? 'Price per hour' :
                                   room.pricing_type === 'daily' ? 'Price per day' :
                                   room.pricing_type === 'custom' ? 'Custom pricing' : 'Price per month'}
                                </p>
                                <p className="text-xl font-bold text-emerald-600">
                                  ₹{(room.pricing_type === 'hourly' ? (room.price_per_hour || 0) :
                                     room.pricing_type === 'daily' ? (room.price_per_day || 0) :
                                     (room.price_per_month || 0)).toLocaleString()}
                                </p>
                              </div>

                              {/* Occupancy Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-400">Occupancy</span>
                                  <span className="font-semibold text-gray-700">{room.current_occupancy}/{room.capacity}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      room.current_occupancy === room.capacity ? "bg-blue-500" :
                                      room.current_occupancy > 0 ? "bg-emerald-500" : "bg-gray-300"
                                    }`}
                                    style={{ width: `${room.capacity > 0 ? (room.current_occupancy / room.capacity) * 100 : 0}%` }}
                                  />
                                </div>
                              </div>

                              {/* Dimensions */}
                              {room.dimensions && room.dimensions.area > 0 && (
                                <div className="text-xs text-gray-400 mb-2">
                                  📐 {room.dimensions.length} × {room.dimensions.width} ft = {room.dimensions.area} sq ft
                                </div>
                              )}

                              {/* Amenities */}
                              {room.amenities && room.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {room.amenities.slice(0, 3).map(a => (
                                    <span key={a} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{a}</span>
                                  ))}
                                  {room.amenities.length > 3 && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">+{room.amenities.length - 3}</span>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => {
                                    const newOccupancy = Math.min(room.current_occupancy + 1, room.capacity);
                                    const newStatus = newOccupancy === room.capacity ? "OCCUPIED" : newOccupancy > 0 ? "AVAILABLE" : "AVAILABLE";
                                    handleUpdateRoom(room.id, { current_occupancy: newOccupancy, status: newStatus });
                                  }}
                                  disabled={room.current_occupancy >= room.capacity}
                                  className="flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Add occupant"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    const newOccupancy = Math.max(room.current_occupancy - 1, 0);
                                    const newStatus = newOccupancy === 0 ? "AVAILABLE" : "AVAILABLE";
                                    handleUpdateRoom(room.id, { current_occupancy: newOccupancy, status: newStatus });
                                  }}
                                  disabled={room.current_occupancy <= 0}
                                  className="flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove occupant"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => openEditRoom(room)}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room.id)}
                                  disabled={room.current_occupancy > 0}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floor Dialog */}
      {showFloorDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFloor ? "Edit Floor" : "Add New Floor"}
                </h2>
                <button onClick={() => { setShowFloorDialog(false); resetFloorForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    value={floorForm.floor_number}
                    onChange={(e) => setFloorForm({ ...floorForm, floor_number: e.target.value })}
                    placeholder="e.g., 0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Floor Name *</label>
                  <input
                    type="text"
                    value={floorForm.floor_name}
                    onChange={(e) => setFloorForm({ ...floorForm, floor_name: e.target.value })}
                    placeholder="e.g., Ground Floor"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={floorForm.description}
                  onChange={(e) => setFloorForm({ ...floorForm, description: e.target.value })}
                  placeholder="Describe this floor..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Floor Amenities</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                  {floorAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={floorForm.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFloorForm({ ...floorForm, amenities: [...floorForm.amenities, amenity] });
                          } else {
                            setFloorForm({ ...floorForm, amenities: floorForm.amenities.filter(a => a !== amenity) });
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowFloorDialog(false); resetFloorForm(); }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFloorSubmit}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all"
                >
                  {editingFloor ? "Update Floor" : "Add Floor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Dialog */}
      {showRoomDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </h2>
                <button onClick={() => { setShowRoomDialog(false); resetRoomForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Floor *</label>
                    <select
                      value={roomForm.floor_id}
                      onChange={(e) => setRoomForm({ ...roomForm, floor_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="">Select floor</option>
                      {getFloorsForRoom().map(f => (
                        <option key={f.id} value={f.id}>{f.floor_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Room Number *</label>
                    <input
                      type="text"
                      value={roomForm.room_number}
                      onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                      placeholder="e.g., G-101"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Room Type *</label>
                    <select
                      value={roomForm.room_type}
                      onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="SINGLE">Single</option>
                      <option value="DOUBLE">Double</option>
                      <option value="TRIPLE">Triple</option>
                      <option value="DORMITORY">Dormitory</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity (beds) *</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pricing Type *</label>
                    <select
                      value={roomForm.pricing_type}
                      onChange={(e) => setRoomForm({ ...roomForm, pricing_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                      <option value="hourly">Hourly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                
                {/* Price Fields Based on Pricing Type */}
                <div className="mt-4">
                  {roomForm.pricing_type === 'monthly' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Month (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={roomForm.price_per_month}
                        onChange={(e) => setRoomForm({ ...roomForm, price_per_month: e.target.value })}
                        placeholder="e.g., 5000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  )}
                  
                  {roomForm.pricing_type === 'daily' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Day (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={roomForm.price_per_day}
                        onChange={(e) => setRoomForm({ ...roomForm, price_per_day: e.target.value })}
                        placeholder="e.g., 500"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  )}
                  
                  {roomForm.pricing_type === 'hourly' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Hour (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={roomForm.price_per_hour}
                        onChange={(e) => setRoomForm({ ...roomForm, price_per_hour: e.target.value })}
                        placeholder="e.g., 100"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  )}
                  
                  {roomForm.pricing_type === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Min Hours</label>
                        <input
                          type="number"
                          min="1"
                          value={roomForm.custom_pricing.min_hours}
                          onChange={(e) => setRoomForm({ 
                            ...roomForm, 
                            custom_pricing: { ...roomForm.custom_pricing, min_hours: e.target.value }
                          })}
                          placeholder="e.g., 2"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max Hours</label>
                        <input
                          type="number"
                          min="1"
                          value={roomForm.custom_pricing.max_hours}
                          onChange={(e) => setRoomForm({ 
                            ...roomForm, 
                            custom_pricing: { ...roomForm.custom_pricing, max_hours: e.target.value }
                          })}
                          placeholder="e.g., 24"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price per Hour (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={roomForm.custom_pricing.price_per_hour}
                          onChange={(e) => setRoomForm({ 
                            ...roomForm, 
                            custom_pricing: { ...roomForm.custom_pricing, price_per_hour: e.target.value }
                          })}
                          placeholder="e.g., 100"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    placeholder="Describe this room..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Room Dimensions (feet)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Length</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={roomForm.dimensions.length}
                      onChange={(e) => {
                        const length = e.target.value;
                        const width = roomForm.dimensions.width;
                        const area = length && width ? (parseFloat(length) * parseFloat(width)).toString() : "";
                        setRoomForm({ ...roomForm, dimensions: { ...roomForm.dimensions, length, area } });
                      }}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={roomForm.dimensions.width}
                      onChange={(e) => {
                        const width = e.target.value;
                        const length = roomForm.dimensions.length;
                        const area = length && width ? (parseFloat(length) * parseFloat(width)).toString() : "";
                        setRoomForm({ ...roomForm, dimensions: { ...roomForm.dimensions, width, area } });
                      }}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Area (sq ft)</label>
                    <input
                      type="number"
                      value={roomForm.dimensions.area}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Room Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                  {roomAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomForm.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoomForm({ ...roomForm, amenities: [...roomForm.amenities, amenity] });
                          } else {
                            setRoomForm({ ...roomForm, amenities: roomForm.amenities.filter(a => a !== amenity) });
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Furnishing */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Furnishing
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                  {furnishingOptions.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomForm.furnishing.includes(item)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoomForm({ ...roomForm, furnishing: [...roomForm.furnishing, item] });
                          } else {
                            setRoomForm({ ...roomForm, furnishing: roomForm.furnishing.filter(f => f !== item) });
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowRoomDialog(false); resetRoomForm(); }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoomSubmit}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all"
                >
                  {editingRoom ? "Update Room" : "Add Room"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
