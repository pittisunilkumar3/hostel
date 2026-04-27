"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import { useEffect, useState, useRef } from "react";

export default function LandingPage() {
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const logo = site.companyLogo;
  const copyright = site.copyrightText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: "Multi-Property",
      description: "Manage unlimited hostels from one dashboard with floors, rooms & occupancy tracking.",
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Role-Based Access",
      description: "Dedicated dashboards for Admins, Owners, and Customers with secure permissions.",
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: "Payments",
      description: "Integrated wallet, subscriptions & multiple payment gateways for seamless transactions.",
      color: "from-purple-500 to-violet-600",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Analytics",
      description: "Real-time insights, occupancy reports & revenue analytics to grow your business.",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: "Easy Booking",
      description: "Instant room booking with confirmation, digital receipts & move-in management.",
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Communication",
      description: "Built-in messaging, notifications & announcements between owners and residents.",
      color: "from-cyan-500 to-sky-600",
      bg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ];

  const stats = [
    { value: "500+", label: "Active Hostels" },
    { value: "10K+", label: "Happy Residents" },
    { value: "50+", label: "Cities" },
    { value: "99.9%", label: "Uptime" },
  ];

  const testimonials = [
    {
      name: "Rajesh Sharma",
      role: "Owner, Urban Stay Hostel",
      location: "Delhi",
      text: "This system increased our occupancy by 40% in just 3 months. The dashboard is incredibly easy to use and the support team is always responsive.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Owner, Green Living PG",
      location: "Ahmedabad",
      text: "The automated booking system and payment processing have saved us countless hours. We can now focus on providing better services to our guests.",
      rating: 5,
    },
    {
      name: "Arun Kumar",
      role: "Owner, Tech Hub Residency",
      location: "Bangalore",
      text: "Revenue increased by 60% after implementing this system. The analytics dashboard helps us make data-driven decisions for our business.",
      rating: 5,
    },
  ];

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#testimonials", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVIGATION ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 py-2"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {logo ? (
                <img src={logo} alt={name} className="w-10 h-10 rounded-xl object-contain ring-2 ring-emerald-100 group-hover:ring-emerald-200 transition-all" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <span className={`text-xl font-bold transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
                {name}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                    scrolled
                      ? "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <button className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  scrolled
                    ? "text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                    : "text-white hover:bg-white/10 border border-white/20"
                }`}>
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`lg:hidden p-2.5 rounded-xl transition-all ${
                scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-top-2 duration-200">
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-sm font-medium transition-all"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <Link href="/login" className="block">
                  <button className="w-full px-4 py-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-all">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" className="block">
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25">
                    Get Started Free
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-emerald-300 text-sm font-medium">Trusted by 500+ Hostel Owners</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1]">
                Manage Your
                <span className="block mt-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                    Hostel Empire
                  </span>
                </span>
                <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2 text-white/80">
                  From One Place
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-white/70 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The all-in-one platform for hostel owners to manage rooms, bookings, payments, and residents with powerful analytics and automation.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link href="/register">
                  <button className="group px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 hover:scale-[1.02]">
                    Start Free Trial
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href="/pages/about-us">
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.02]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Learn More
                  </button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {["R", "P", "A", "S", "M"].map((letter, i) => {
                    const colors = ["bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-indigo-500"];
                    return (
                      <div
                        key={i}
                        className={`w-10 h-10 ${colors[i]} rounded-full border-2 border-emerald-900 flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-white/80 text-sm ml-1">4.9/5</span>
                  </div>
                  <p className="text-white/50 text-xs">from 200+ reviews</p>
                </div>
              </div>
            </div>

            {/* Right - Login Cards */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />

                <div className="relative space-y-4">
                  <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-6 text-center">
                    Choose Your Portal
                  </h3>

                  {/* Admin Card */}
                  <Link href="/login/admin" className="group block">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-5 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-[1.02]">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Super Admin</h4>
                        <p className="text-white/50 text-sm">Full system control & analytics</p>
                      </div>
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <svg className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* Owner Card */}
                  <Link href="/login/owner" className="group block">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-5 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-[1.02]">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">Hostel Owner</h4>
                        <p className="text-white/50 text-sm">Manage properties & bookings</p>
                      </div>
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <svg className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* Customer Card */}
                  <Link href="/login/user" className="group block">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-5 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-[1.02]">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">Customer</h4>
                        <p className="text-white/50 text-sm">Browse & book rooms easily</p>
                      </div>
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <svg className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  <p className="text-center text-white/40 text-xs mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Register here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 50L48 45C96 40 192 30 288 28C384 26 480 32 576 40C672 48 768 58 864 60C960 62 1056 56 1152 48C1248 40 1344 30 1392 25L1440 20V100H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== MOBILE LOGIN CARDS (visible on mobile only) ===== */}
      <section className="lg:hidden py-8 bg-white">
        <div className="max-w-md mx-auto px-4">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 text-center">
            Choose Your Portal
          </h3>
          <div className="space-y-3">
            {[
              { href: "/login/admin", label: "Super Admin", desc: "Full system control", gradient: "from-purple-600 to-violet-700", icon: "🛡️" },
              { href: "/login/owner", label: "Hostel Owner", desc: "Manage properties", gradient: "from-emerald-600 to-teal-700", icon: "🏢" },
              { href: "/login/user", label: "Customer", desc: "Browse & book", gradient: "from-blue-600 to-cyan-700", icon: "👤" },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="block">
                <div className={`bg-gradient-to-r ${card.gradient} rounded-xl p-4 flex items-center gap-4 text-white`}>
                  <span className="text-2xl">{card.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold">{card.label}</h4>
                    <p className="text-white/70 text-sm">{card.desc}</p>
                  </div>
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section ref={statsRef} className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`text-center transition-all duration-700 ${
                  statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Powerful Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A complete suite of tools designed specifically for modern hostel management
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <div className={feature.iconColor}>{feature.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-sm font-medium mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Three simple steps to transform your hostel management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up in under 2 minutes. No credit card required for the free trial.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Setup Property",
                description: "Add your hostel details, floors, rooms, pricing, and amenities.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Start Earning",
                description: "Accept bookings, manage residents, and track revenue in real-time.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px]">
                    <div className="h-full bg-gradient-to-r from-emerald-200 to-teal-200" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-2 border-r-2 border-emerald-300 transform rotate-45" />
                  </div>
                )}

                {/* Step number badge */}
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl flex items-center justify-center mx-auto group-hover:from-emerald-100 group-hover:to-teal-100 transition-all duration-300 border border-emerald-100">
                    <div className="text-emerald-600">{step.icon}</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/30">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <button className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] inline-flex items-center gap-3">
                Start Your Free Trial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-emerald-300 text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Loved by Hostel Owners
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              See what our partners say about transforming their business
            </p>
          </div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className={`bg-white/10 backdrop-blur-sm rounded-2xl p-7 border transition-all duration-500 ${
                  activeTestimonial === i
                    ? "border-emerald-400/50 scale-105 shadow-2xl shadow-emerald-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{testimonial.name}</h4>
                    <p className="text-white/50 text-xs">{testimonial.role}, {testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeTestimonial === i ? "bg-emerald-400 w-6" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-12 lg:p-16 overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />

            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                Join 500+ hostel owners who trust our platform. Start your free trial today — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <button className="group px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02]">
                    Get Started Free
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="contact" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                {logo ? (
                  <img src={logo} alt={name} className="w-10 h-10 rounded-xl object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <span className="text-xl font-bold">{name}</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {site.companyDescription || "The complete hostel management solution for modern accommodation providers."}
              </p>
              {site.companyEmail && (
                <a href={`mailto:${site.companyEmail}`} className="text-gray-400 hover:text-emerald-400 text-sm flex items-center gap-2 mb-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {site.companyEmail}
                </a>
              )}
              {site.companyPhone && (
                <a href={`tel:${site.companyPhone}`} className="text-gray-400 hover:text-emerald-400 text-sm flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {site.companyPhone}
                </a>
              )}
            </div>

            {/* For Owners */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">For Owners</h4>
              <ul className="space-y-3">
                <li><Link href="/register" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Become a Partner</Link></li>
                <li><Link href="/login/owner" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Owner Login</Link></li>
                <li><Link href="/pages/about-us" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* For Residents */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">For Residents</h4>
              <ul className="space-y-3">
                <li><Link href="/login/user" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Find Hostels</Link></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">How it Works</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Features</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/pages/privacy-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Privacy Policy</Link></li>
                <li><Link href="/pages/terms-and-conditions" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/pages/refund-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Refund Policy</Link></li>
                <li><Link href="/pages/cancellation-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">Cancellation Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">{copyright}</p>
            <div className="flex items-center gap-4">
              {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
                <a key={social} href="#" className="w-9 h-9 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <span className="text-xs font-bold">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ===== ANIMATIONS CSS ===== */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
