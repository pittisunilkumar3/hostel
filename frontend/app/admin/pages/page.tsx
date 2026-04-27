"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

interface CmsPage {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PAGES = [
  {
    slug: "about-us",
    title: "About Us",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    description: "Tell visitors about your hostel business, mission, and values",
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: "Legal terms and conditions for using your services",
    color: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    description: "How you collect, use, and protect user data",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Refund rules, eligibility, and procedures",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Cancellation rules, fees, and timelines",
    color: "from-red-500 to-rose-600",
    bgLight: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    description: "Shipping and delivery information for physical items",
    color: "from-cyan-500 to-blue-600",
    bgLight: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
];

export default function CmsPagesManagement() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await apiFetch("/api/cms/pages");
      if (res.success && res.data) {
        setPages(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreatePage = async (slug: string, title: string) => {
    setCreating(slug);
    try {
      const res = await apiFetch("/api/cms/pages", {
        method: "POST",
        body: JSON.stringify({ slug, title, content: "", isActive: true }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ "${title}" page created successfully!` });
        fetchPages();
      } else {
        setMessage({ type: "error", text: res.message || "Failed to create page" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setCreating(null);
    }
  };

  const handleToggleStatus = async (page: CmsPage) => {
    try {
      const res = await apiFetch(`/api/cms/pages/${page.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !page.is_active }),
      });
      if (res.success) {
        setMessage({
          type: "success",
          text: `✅ "${page.title}" ${!page.is_active ? "enabled" : "disabled"}!`,
        });
        fetchPages();
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const getExistingPage = (slug: string) => pages.find((p) => p.slug === slug);

  const getContentPreview = (content: string | null) => {
    if (!content) return null;
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > 120 ? text.substring(0, 120) + "..." : text;
  };

  const getContentWordCount = (content: string | null) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, "");
    return text.split(/\s+/).filter(Boolean).length;
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={getSidebarItems()}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              CMS Pages
            </h1>
            <p className="text-gray-500 mt-2 ml-[52px]">
              Manage your website pages content. Create and edit pages that visitors can view.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pages/about-us"
              target="_blank"
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Site
            </Link>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{DEFAULT_PAGES.length}</div>
          <div className="text-sm text-gray-500">Total Pages</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-emerald-600">{pages.filter((p) => p.is_active).length}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-amber-600">{pages.filter((p) => !p.content).length}</div>
          <div className="text-sm text-gray-500">Empty</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-400">{DEFAULT_PAGES.length - pages.length}</div>
          <div className="text-sm text-gray-500">Not Created</div>
        </div>
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEFAULT_PAGES.map((defaultPage) => {
            const existing = getExistingPage(defaultPage.slug);
            const contentPreview = existing ? getContentPreview(existing.content) : null;
            const wordCount = existing ? getContentWordCount(existing.content) : 0;

            return (
              <div
                key={defaultPage.slug}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${defaultPage.color} text-white shadow-lg`}
                      >
                        {defaultPage.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {defaultPage.title}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">/pages/{defaultPage.slug}</p>
                      </div>
                    </div>
                    {existing && (
                      <button
                        onClick={() => handleToggleStatus(existing)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          existing.is_active ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            existing.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{defaultPage.description}</p>

                  {/* Content Status */}
                  {existing ? (
                    <div className="space-y-3">
                      {contentPreview ? (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">Content Preview</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{contentPreview}</p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-sm text-amber-700">No content yet</span>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {wordCount > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            {wordCount} words
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(existing.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            existing.is_active ? "text-emerald-500" : "text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              existing.is_active ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          />
                          {existing.is_active ? "Live" : "Hidden"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm text-gray-400">Page not created yet</p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6 flex items-center gap-2">
                  {existing ? (
                    <>
                      <Link
                        href={`/admin/pages/${defaultPage.slug}`}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all text-center shadow-lg shadow-purple-500/20"
                      >
                        Edit Content
                      </Link>
                      <Link
                        href={`/pages/${defaultPage.slug}`}
                        target="_blank"
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCreatePage(defaultPage.slug, defaultPage.title)}
                      disabled={creating === defaultPage.slug}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                      {creating === defaultPage.slug ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Page
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Info */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-900 mb-2">How CMS Pages Work</h4>
            <ul className="text-sm text-purple-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">1.</span>
                <span>Click <strong>&quot;Create Page&quot;</strong> to initialize a new page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">2.</span>
                <span>Use <strong>&quot;Edit Content&quot;</strong> to open the rich text editor and add your content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">3.</span>
                <span>Toggle the <strong>status switch</strong> to show/hide pages on the live site</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">4.</span>
                <span>Click <strong>&quot;View&quot;</strong> to preview how the page looks to visitors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">5.</span>
                <span>Pages are accessible at <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs">/pages/[slug]</code></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
