"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/auth";
import { useSiteSettings } from "@/lib/siteSettings";

interface CmsPage {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  is_active: number;
  updated_at: string;
}

export default function CmsPageView() {
  const params = useParams();
  const slug = params.slug as string;
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";

  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/cms/pages/slug/${slug}`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.is_active) {
            setPage(data.data);
          } else {
            setError("This page is currently unavailable.");
          }
        } else {
          setError("Page not found.");
        }
      } catch {
        setError("Failed to load page. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPage();
  }, [slug]);

  const formatTitle = (s: string) =>
    s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pages/about-us", label: "About Us" },
    { href: "/pages/privacy-policy", label: "Privacy Policy" },
    { href: "/pages/terms-and-conditions", label: "Terms" },
    { href: "/pages/refund-policy", label: "Refund Policy" },
  ];

  const pageIcons: Record<string, JSX.Element> = {
    "privacy-policy": (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    "terms-and-conditions": (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    "about-us": (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    "refund-policy": (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "cancellation-policy": (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/5"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {site.companyLogo ? (
                <img
                  src={site.companyLogo}
                  alt={name}
                  className="w-10 h-10 rounded-xl object-contain ring-2 ring-emerald-100 group-hover:ring-emerald-200 transition-all"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {name}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    link.href === `/pages/${slug}`
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      link.href === `/pages/${slug}`
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-16 lg:pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 overflow-hidden">
          <div className="absolute inset-0" style={{ opacity: 0.1 }}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-400 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center gap-2 text-emerald-200 text-sm mb-8">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white font-medium">
                {page?.title || formatTitle(slug)}
              </span>
            </nav>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20 shadow-2xl shadow-black/10">
              <div className="text-white">
                {pageIcons[slug] || (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              {page?.title || formatTitle(slug)}
            </h1>

            {/* Subtitle */}
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-6">
              {slug === "privacy-policy" && "How we collect, use, and protect your personal information"}
              {slug === "terms-and-conditions" && "Please read these terms carefully before using our services"}
              {slug === "about-us" && "Learn more about our mission, values, and the team behind the platform"}
              {slug === "refund-policy" && "Our policies regarding refunds and payment returns"}
              {slug === "cancellation-policy" && "Guidelines for cancelling bookings and associated terms"}
              {!["privacy-policy", "terms-and-conditions", "about-us", "refund-policy", "cancellation-policy"].includes(slug) && `Important information about ${formatTitle(slug).toLowerCase()}`}
            </p>

            {/* Last Updated Badge */}
            {page && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-emerald-100 border border-white/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last updated:{" "}
                {new Date(page.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 60L48 52C96 44 192 28 288 22C384 16 480 20 576 28C672 36 768 48 864 50C960 52 1056 44 1152 36C1248 28 1344 20 1392 16L1440 12V60H0Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* ===== CONTENT SECTION ===== */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Page Not Available</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
          </div>
        ) : page ? (
          <div className="space-y-8">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Content */}
              <div className="p-6 sm:p-8 lg:p-10">
                {page.content ? (
                  <div
                    className="cms-content prose prose-gray max-w-none
                      prose-headings:scroll-mt-24
                      prose-h1:text-2xl prose-h1:font-bold prose-h1:text-gray-900 prose-h1:mb-4 prose-h1:mt-8 first:prose-h1:mt-0
                      prose-h2:text-xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:mb-3 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                      prose-h3:text-lg prose-h3:font-semibold prose-h3:text-gray-800 prose-h3:mb-2 prose-h3:mt-6
                      prose-h4:text-base prose-h4:font-semibold prose-h4:text-gray-800 prose-h4:mb-2 prose-h4:mt-4
                      prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
                      prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-ul:my-4 prose-ol:my-4
                      prose-li:text-gray-600 prose-li:my-1
                      prose-li::marker:text-emerald-500
                      prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:my-6
                      prose-blockquote:text-gray-700 prose-blockquote:italic
                      prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
                      prose-table:rounded-xl prose-table:overflow-hidden prose-table:border prose-table:border-gray-200
                      prose-th:bg-gray-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-sm prose-th:font-semibold prose-th:text-gray-700
                      prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:text-gray-600 prose-td:border-t prose-td:border-gray-100
                      prose-hr:border-gray-200 prose-hr:my-8
                      [&_ul]:list-disc [&_ul]:pl-6
                      [&_ol]:list-decimal [&_ol]:pl-6"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No content available yet.</p>
                    <p className="text-gray-400 text-sm mt-2">The admin hasn&apos;t added content for this page.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Pages</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { slug: "privacy-policy", label: "Privacy Policy", desc: "How we handle your data", icon: "🔒" },
                  { slug: "terms-and-conditions", label: "Terms & Conditions", desc: "Legal terms of service", icon: "📋" },
                  { slug: "refund-policy", label: "Refund Policy", desc: "Refund rules & procedures", icon: "💰" },
                  { slug: "cancellation-policy", label: "Cancellation Policy", desc: "Cancellation guidelines", icon: "❌" },
                  { slug: "about-us", label: "About Us", desc: "Learn about our mission", icon: "ℹ️" },
                ]
                  .filter((p) => p.slug !== slug)
                  .slice(0, 4)
                  .map((p) => (
                    <Link
                      key={p.slug}
                      href={`/pages/${p.slug}`}
                      className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                        {p.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {p.label}
                        </h4>
                        <p className="text-sm text-gray-500 mt-0.5">{p.desc}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white mt-8">
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to get started?</h3>
                <p className="text-emerald-100">Join thousands of satisfied customers managing their hostels with us.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-lg"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/pages/about-us"
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                {site.companyLogo ? (
                  <img src={site.companyLogo} alt={name} className="w-10 h-10 rounded-xl object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <span className="text-xl font-bold">{name}</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                {site.description || "The complete hostel management solution for modern accommodation providers."}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/pages/about-us" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/pages/privacy-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pages/terms-and-conditions" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/pages/refund-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pages/cancellation-policy" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                    Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact Us</h4>
              <ul className="space-y-3">
                {site.companyEmail && (
                  <li>
                    <a
                      href={`mailto:${site.companyEmail}`}
                      className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {site.companyEmail}
                    </a>
                  </li>
                )}
                {site.companyPhone && (
                  <li>
                    <a
                      href={`tel:${site.companyPhone}`}
                      className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {site.companyPhone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              {site.copyrightText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}
            </p>
            <div className="flex items-center gap-6">
              <Link href="/pages/privacy-policy" className="text-gray-500 hover:text-emerald-400 text-xs transition-colors">
                Privacy
              </Link>
              <Link href="/pages/terms-and-conditions" className="text-gray-500 hover:text-emerald-400 text-xs transition-colors">
                Terms
              </Link>
              <Link href="/pages/about-us" className="text-gray-500 hover:text-emerald-400 text-xs transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
