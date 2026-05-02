"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import StatCard from "@/app/components/StatCard";
import { getCurrentUser, apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useCurrency } from "@/lib/useCurrency";

const sidebarItems = getSidebarItems();

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<RecentUser[]>([]);
  const { fc, symbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getCurrentUser()); }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch("/api/users?page=1&limit=5");
        if (res.success) setUsers(res.data.users || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: "bg-violet-50 text-violet-700 border border-violet-200",
      OWNER: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      CUSTOMER: "bg-sky-50 text-sky-700 border border-sky-200",
    };
    return map[role] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const getRoleIcon = (role: string) => {
    if (role === "SUPER_ADMIN") return "🛡️";
    if (role === "OWNER") return "🏠";
    return "👤";
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Welcome Banner */}
      <div className="mb-6 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-10" />
        <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name || "Admin"}! 👋</h1>
          <p className="text-violet-200 mt-1 text-sm">Here&apos;s an overview of your hostel management system.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={users.length > 0 ? "3+" : "—"} change="+12%" subtitle="vs last month" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>} color="text-violet-600" bgColor="bg-violet-50" />
        <StatCard title="Total Rooms" value="4" change="+2" subtitle="newly added" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} color="text-sky-600" bgColor="bg-sky-50" />
        <StatCard title="Active Bookings" value="—" subtitle="current month" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Revenue" value={fc(15000)} change="+8%" subtitle="this month" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-amber-600" bgColor="bg-amber-50" />
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Recent Users</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest registered users in the system</p>
          </div>
          <span className="text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg font-semibold">{users.length} total</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-violet-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No users found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-sm">
                  {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${getRoleBadge(u.role)}`}>
                  {getRoleIcon(u.role)} {u.role.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-400 hidden sm:block">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>, title: "Add New Owner", desc: "Register a new hostel owner", color: "violet", href: "/register/owner" },
          { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>, title: "Add New Room", desc: "Create a new hostel room", color: "sky", href: "/admin/rooms" },
          { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, title: "System Settings", desc: "OTP providers & Google login", color: "emerald", href: "/admin/settings" },
        ].map((action) => (
          <a key={action.title} href={action.href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300 group block">
            <div className={`w-11 h-11 bg-${action.color}-50 text-${action.color}-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-${action.color}-100 transition-colors`}>
              {action.icon}
            </div>
            <p className="font-bold text-gray-900 text-sm group-hover:text-violet-700 transition-colors">{action.title}</p>
            <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
          </a>
        ))}
      </div>
    </DashboardShell>
  );
}
