"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logout, isAuthenticated } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useState, useRef, useEffect, useCallback, startTransition } from "react";

function LanguageSwitcher() {
  const { locale, setLocale, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  if (languages.length <= 1) return null;
  const current = languages.find(l => l.code === locale);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
        <span className="uppercase font-bold">{locale}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 min-w-[160px] z-50">
          {languages.map(l => (
            <button key={l.code} onClick={() => { setLocale(l.code); setOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${l.code === locale ? "bg-sky-50 text-sky-700 font-semibold" : "text-gray-700"}`}>
              <span className="font-mono text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded">{l.code}</span>
              <span>{l.name}</span>
              {l.is_default && <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">DEF</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
import { useSiteSettings } from "@/lib/siteSettings";
import NotificationBell from "@/app/components/NotificationBell";

interface SidebarItem {
  label: string;
  heading?: boolean; // section divider
  href?: string;
  icon?: React.ReactNode;
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
    return item.children.some(child => pathname === child.href);
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => startTransition(() => setSidebarOpen(false))} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${accentBg} text-white transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col h-screen`}>
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-5 border-b border-white/10">
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
          <button className="lg:hidden text-white/50 hover:text-white p-1" onClick={() => startTransition(() => setSidebarOpen(false))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Nav — scrollable area */}
        <nav className="flex-1 mt-3 px-3 space-y-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
          {items.map((item, idx) => {
            // Section heading divider
            if (item.heading) {
              return (
                <div key={`heading-${idx}`} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{item.label}</p>
                  <div className="mt-1.5 border-t border-white/10" />
                </div>
              );
            }

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
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={`${child.href}-${cidx}`}
                            href={child.href}
                            onClick={() => startTransition(() => setSidebarOpen(false))}
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
                onClick={() => startTransition(() => setSidebarOpen(false))}
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

        {/* User Info — pinned to bottom */}
        <div className="flex-shrink-0 p-3 border-t border-white/10">
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
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
          <LanguageSwitcher />
          <NotificationBell />
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
