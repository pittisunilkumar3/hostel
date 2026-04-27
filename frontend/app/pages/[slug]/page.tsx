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
}

export default function CmsPageView() {
  const params = useParams();
  const slug = params.slug as string;
  const site = useSiteSettings();
  const name = site.companyName || "Hostel Management";

  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (e) {
        setError("Failed to load page. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPage();
  }, [slug]);

  // Page icons for different slugs
  const getPageIcon = (slug: string) => {
    switch (slug) {
      case "privacy-policy":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case "terms-and-conditions":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "about-us":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "refund-policy":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "cancellation-policy":
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  // Format title from slug
  const formatTitle = (slug: string) => {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              {site.companyLogo ? (
                <img src={site.companyLogo} alt={name} className="w-10 h-10 rounded-xl object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">{name}</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:py-12">
        {loading ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12">
              <div className="animate-pulse">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                  <div className="h-8 bg-gray-200 rounded w-64" />
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Available</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        ) : page ? (
          <div className="max-w-4xl mx-auto">
            {/* Page Header Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-6 lg:p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  {getPageIcon(slug)}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">{page.title || formatTitle(slug)}</h1>
                  <p className="text-blue-100 text-sm mt-1">Last updated: {new Date(page.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 border-t-0">
              <div className="p-6 lg:p-8">
                {page.content ? (
                  <div
                    className="prose prose-blue prose-lg max-w-none
                      prose-headings:text-gray-900 prose-headings:font-bold
                      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                      prose-p:text-gray-700 prose-p:leading-relaxed
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-gray-900
                      prose-ul:text-gray-700 prose-ol:text-gray-700
                      prose-li:my-1
                      prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:p-4 prose-blockquote:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No content available yet.</p>
                    <p className="text-gray-400 text-sm mt-1">The admin hasn&apos;t added content for this page.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Pages */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { slug: "privacy-policy", label: "Privacy Policy" },
                { slug: "terms-and-conditions", label: "Terms & Conditions" },
                { slug: "refund-policy", label: "Refund Policy" },
                { slug: "cancellation-policy", label: "Cancellation Policy" },
              ]
                .filter((p) => p.slug !== slug)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/pages/${p.slug}`}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-center"
                  >
                    <span className="text-sm font-medium text-gray-700 hover:text-blue-600">{p.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              {site.copyrightText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}
            </div>
            <div className="flex space-x-6">
              <Link href="/pages/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/pages/terms-and-conditions" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/pages/about-us" className="text-gray-400 hover:text-white text-sm transition-colors">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
