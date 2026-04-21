"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logout, isAuthenticated } from "@/lib/auth";
import { useSiteSettings } from "@/lib/siteSettings";
import { useState, useEffect } from "react";

interface SidebarItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

interface DashboardShellProps {
  children: React.ReactNode;
  role: "admin" | "owner" | "user";
  title: string;
  items: SidebarItem[];
  accentColor: string;
  accentBg: string;
  hoverBg: string;
}

export default function DashboardShell({
  children,
  role,
  title,
  items,
  accentColor,
  accentBg,
  hoverBg,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const site = useSiteSettings();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const u = getCurrentUser();
    const authed = isAuthenticated();

    if (!authed || !u) {
      router.replace(`/login/${role}`);
      return;
    }

    const expectedRole = role === "admin" ? "SUPER_ADMIN" : role === "owner" ? "OWNER" : "CUSTOMER";
    if (u.role !== expectedRole) {
      router.replace(`/login/${role}`);
      return;
    }

    setUser(u);
    setChecked(true);
  }, [role, router]);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isDropdownActive = (item: SidebarItem) => {
    if (!item.children) return false;
    return item.children.some(child => {
      // Match ignoring query params: /admin/help-support?tab=x → /admin/help-support
      const childPath = child.href.split('?')[0];
      return pathname === childPath;
    });
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 ${accentBg} text-white transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          {site.companyLogo ? (
            <img src={site.companyLogo} alt={site.companyName} className="w-10 h-10 rounded-xl object-contain bg-white/20 backdrop-blur-sm" />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg backdrop-blur-sm">
              {(site.companyName || title).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm truncate">{site.companyName || title}</h1>
            <p className="text-[10px] text-white/50">Management Panel</p>
          </div>
          <button className="lg:hidden text-white/50 hover:text-white p-1" onClick={() => setSidebarOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-3 px-3 space-y-1 overflow-y-auto">
          {items.map((item, idx) => {
            // Dropdown item with children
            if (item.children && item.children.length > 0) {
              const isOpen = openDropdowns[item.label] || isDropdownActive(item);
              const isActive = isDropdownActive(item);
              return (
                <div key={`dropdown-${item.label}-${idx}`}>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children.map((child, cidx) => {
                        // Match ignoring query params for dropdown detection
                        const childPath = child.href.split('?')[0];
                        const childHasQuery = child.href.includes('?');
                        // Basic path match
                        const pathMatch = pathname === childPath;
                        // For highlighting: if this child has a query param, only highlight if current URL also has that param
                        // If this child has NO query param, highlight only if no other sibling with query matches
                        let isChildActive = false;
                        if (pathMatch) {
                          if (childHasQuery) {
                            // Check if URL has this specific query
                            try {
                              const urlObj = new URL(window.location.href);
                              const childUrl = new URL(child.href, window.location.origin);
                              isChildActive = urlObj.search === childUrl.search;
                            } catch { isChildActive = false; }
                          } else {
                            // No query on child — only active if URL also has no query
                            isChildActive = !window.location.search;
                          }
                        }
                        return (
                          <Link
                            key={`${child.href}-${cidx}`}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isChildActive
                                ? "bg-white/15 text-white"
                                : "text-white/40 hover:bg-white/5 hover:text-white/80"
                            }`}
                          >
                            {child.icon || <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular link item
            const isActive = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${idx}`}
                href={item.href || "#"}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white w-full transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-gray-500 hover:text-gray-700 p-1" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-800 capitalize">
              {pathname === `/${role}/dashboard` ? "Dashboard" : pathname.split("/").pop()?.replace(/-/g, " ")}
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 ${accentBg} text-white rounded-lg flex items-center justify-center text-xs font-bold`}>
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name || "User"}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
