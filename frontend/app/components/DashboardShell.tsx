"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logout, isAuthenticated } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useState, useRef, useEffect, useCallback, startTransition } from "react";

/* ──────────────────────────── Language Switcher ──────────────────────────── */

function LanguageSwitcher() {
  const { locale, setLocale, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  if (languages.length <= 1) return null;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
        <span className="uppercase font-bold">{locale}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 min-w-[160px] z-50">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${l.code === locale ? "bg-sky-50 text-sky-700 font-semibold" : "text-gray-700"}`}
            >
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

/* ──────────────────── Global Search Modal (Ctrl + K) ──────────────────── */

function GlobalSearch({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Listen for custom event from the header search button
  useEffect(() => {
    const openSearch = () => setOpen(true);
    document.addEventListener("open-global-search", openSearch);
    return () => document.removeEventListener("open-global-search", openSearch);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const suggestions = [
    { label: "Dashboard", href: `/${role}/dashboard` },
    { label: "Users", href: `/${role}/users` },
    { label: "Zones", href: `/${role}/zones` },
    { label: "Bookings", href: `/${role}/bookings` },
    { label: "Settings", href: `/${role}/settings` },
    { label: "Banners", href: `/${role}/banners` },
    { label: "Coupons", href: `/${role}/coupons` },
    { label: "Campaigns", href: `/${role}/campaigns` },
    { label: "Business Setup", href: `/${role}/business-setup` },
  ];
  const filtered = query.trim()
    ? suggestions.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400" />
          <kbd className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No results found</div>
          ) : (
            <div className="py-2">
              {filtered.map(s => (
                <Link key={s.href} href={s.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Notification Bell (push) ────────────────────── */
import NotificationBell from "@/app/components/NotificationBell";
import { useSiteSettings } from "@/lib/siteSettings";

/* ──────────────────────────── Types ──────────────────────────── */

interface SidebarItem {
  label: string;
  heading?: boolean;
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

/* ════════════════════════ DashboardShell ════════════════════════ */

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

  /* ── Auth gate ── */
  useEffect(() => {
    const u = getCurrentUser();
    const authed = isAuthenticated();
    if (!authed || !u) { router.replace(`/login/${role}`); return; }
    const expectedRole = role === "admin" ? "SUPER_ADMIN" : role === "owner" ? "OWNER" : "CUSTOMER";
    if (u.role !== expectedRole) { router.replace(`/login/${role}`); return; }
    setUser(u);
    setChecked(true);
  }, [role, router]);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const toggleDropdown = (label: string) => setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }));

  const isDropdownActive = (item: SidebarItem) => {
    if (!item.children) return false;
    return item.children.some(child => pathname === child.href);
  };

  /* ── Profile dropdown (mirrors reference header accountNavbarDropdown) ── */
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Badge counts for messages & pending orders ── */
  const [msgCount, setMsgCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        const [msgRes, orderRes] = await Promise.allSettled([
          fetch("/api/conversations/unread-count", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch("/api/bookings/pending-count", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
        if (!cancelled) {
          if (msgRes.status === "fulfilled" && msgRes.value?.success) setMsgCount(msgRes.value.data?.count || 0);
          if (orderRes.status === "fulfilled" && orderRes.value?.success) setOrderCount(orderRes.value.data?.count || 0);
        }
      } catch { /* badges stay 0 */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  /* ── Loading state ── */
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

  /* ════════════════════════ Render ════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* ── Global Search Modal (Ctrl+K) ── */}
      <GlobalSearch role={role} />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => startTransition(() => setSidebarOpen(false))} />
      )}

      {/* ════════════════════════ SIDEBAR ════════════════════════ */}
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

        {/* Nav */}
        <nav className="flex-1 mt-3 px-3 space-y-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}>
          {items.map((item, idx) => {
            if (item.heading) {
              return (
                <div key={`heading-${idx}`} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{item.label}</p>
                  <div className="mt-1.5 border-t border-white/10" />
                </div>
              );
            }

            if (item.children && item.children.length > 0) {
              const isOpen = openDropdowns[item.label] || isDropdownActive(item);
              const isActive = isDropdownActive(item);
              return (
                <div key={`dropdown-${item.label}-${idx}`}>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full ${isActive ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
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
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${isChildActive ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/80"}`}
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

            const isActive = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${idx}`}
                href={item.href || "#"}
                onClick={() => startTransition(() => setSidebarOpen(false))}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
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
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold">{initials}</div>
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

      {/* ════════════════════════ MAIN AREA ════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">

        {/* ════════════════════════ HEADER BAR ════════════════════════
            Mirrors the reference superadmin header:
            Logo area → Search (Ctrl+K) → Language → Messages → Orders → Notifications → Profile dropdown
        ════════════════════════════════════════════════════════════════ */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-6 py-2.5 flex items-center gap-2 sticky top-0 z-30">

          {/* Mobile sidebar toggle */}
          <button className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          {/* Page title (left) */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 capitalize truncate">
              {pathname === `/${role}/dashboard` ? "Dashboard" : pathname.split("/").pop()?.replace(/-/g, " ")}
            </h2>
          </div>

          {/* ── Search trigger button (Ctrl+K) — matches reference header search ── */}
          <button
            onClick={() => document.dispatchEvent(new Event("open-global-search"))}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-muted">Search</span>
            <kbd className="text-[10px] bg-white text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 font-mono font-bold">Ctrl+K</kbd>
          </button>

          {/* ── Language switcher ── */}
          <LanguageSwitcher />

          {/* ── Messages icon with unread badge — mirrors reference header messages icon ── */}
          <Link
            href={`/${role}/help-support/conversations`}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            title="Messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {msgCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                {msgCount > 9 ? "9+" : msgCount}
              </span>
            )}
          </Link>

          {/* ── Orders/Bookings icon with pending badge — mirrors reference header order icon ── */}
          <Link
            href={`/${role}/bookings`}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            title="Bookings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {orderCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                {orderCount > 9 ? "9+" : orderCount}
              </span>
            )}
          </Link>

          {/* ── Push notification bell ── */}
          <NotificationBell />

          {/* ── Profile dropdown — mirrors reference header accountNavbarDropdown ── */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-100 transition-all"
            >
              <div className={`w-8 h-8 ${accentBg} text-white rounded-lg flex items-center justify-center text-xs font-bold`}>{initials}</div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || "User"}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{user?.email}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {/* Dropdown — matches reference header accountNavbarDropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {/* User card */}
                <div className="p-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${accentBg} text-white rounded-xl flex items-center justify-center text-sm font-bold`}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items — matches reference header dropdown links */}
                <div className="py-1">
                  <Link
                    href={`/${role}/settings`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Settings
                  </Link>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ════════════════════════ CONTENT ════════════════════════ */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
