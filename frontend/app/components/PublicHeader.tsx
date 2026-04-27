"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/siteSettings";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/auth";

export default function PublicHeader() {
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";
  const logo = site.companyLogo;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginUrl, setLoginUrl] = useState("/login/user");
  const [registerUrl, setRegisterUrl] = useState("/register/customer");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchLoginUrl = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/login-url-public`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.customer_login_url) setLoginUrl(`/login/${data.data.customer_login_url}`);
        }
      } catch {}
    };
    fetchLoginUrl();
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pages/about-us", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {site.companyPhone && (
              <a href={`tel:${site.companyPhone}`} className="flex items-center gap-1 hover:text-emerald-200 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {site.companyPhone}
              </a>
            )}
            {site.companyEmail && (
              <a href={`mailto:${site.companyEmail}`} className="flex items-center gap-1 hover:text-emerald-200 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {site.companyEmail}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pages/privacy-policy" className="hover:text-emerald-200 transition-colors">Privacy</Link>
            <span className="text-emerald-500">|</span>
            <Link href="/pages/terms-and-conditions" className="hover:text-emerald-200 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white shadow-lg shadow-black/5"
            : "bg-white shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              {logo ? (
                <img src={logo} alt={name} className="h-9 rounded-lg object-contain" />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <span className="text-lg font-bold text-gray-900 hidden sm:block">
                {name.split(" ")[0]}
                <span className="text-emerald-600">{name.split(" ").slice(1).join(" ")}</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="relative group">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-1">
                  Policies
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="absolute top-full left-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all mt-1">
                  {[
                    { href: "/pages/privacy-policy", label: "Privacy Policy" },
                    { href: "/pages/terms-and-conditions", label: "Terms & Conditions" },
                    { href: "/pages/cancellation-policy", label: "Cancellation Policy" },
                    { href: "/pages/refund-policy", label: "Refund Policy" },
                  ].map((link) => (
                    <Link key={link.href} href={link.href} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <Link href={loginUrl} className="hidden sm:block">
                <button className="px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300">
                  Login
                </button>
              </Link>
              <Link href={registerUrl}>
                <button className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg transition-all shadow-md shadow-emerald-500/25">
                  Register
                </button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all ml-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-sm font-medium transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Policies</p>
                {[
                  { href: "/pages/privacy-policy", label: "Privacy Policy" },
                  { href: "/pages/terms-and-conditions", label: "Terms & Conditions" },
                  { href: "/pages/cancellation-policy", label: "Cancellation Policy" },
                  { href: "/pages/refund-policy", label: "Refund Policy" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-sm transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
                <Link href={loginUrl} className="flex-1">
                  <button className="w-full px-4 py-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-all">
                    Login
                  </button>
                </Link>
                <Link href={registerUrl} className="flex-1">
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-emerald-500/25">
                    Register
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
