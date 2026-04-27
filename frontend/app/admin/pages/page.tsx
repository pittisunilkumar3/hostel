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
  { slug: "about-us", title: "About Us", icon: "ℹ️", description: "Tell visitors about your hostel business" },
  { slug: "terms-and-conditions", title: "Terms and Conditions", icon: "📋", description: "Legal terms for using your services" },
  { slug: "privacy-policy", title: "Privacy Policy", icon: "🔒", description: "How you handle user data" },
  { slug: "refund-policy", title: "Refund Policy", icon: "💰", description: "Refund rules and procedures" },
  { slug: "cancellation-policy", title: "Cancellation Policy", icon: "❌", description: "Cancellation rules and fees" },
  { slug: "shipping-policy", title: "Shipping Policy", icon: "📦", description: "Shipping and delivery information" },
];

export default function CmsPagesManagement() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    }
  };

  const handleToggleStatus = async (page: CmsPage) => {
    try {
      const res = await apiFetch(`/api/cms/pages/${page.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !page.is_active }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ "${page.title}" ${!page.is_active ? "enabled" : "disabled"}!` });
        fetchPages();
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const getExistingPage = (slug: string) => pages.find((p) => p.slug === slug);

  const getContentPreview = (content: string | null) => {
    if (!content) return "No content yet";
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            CMS Pages Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your website pages content (Privacy Policy, Terms, About Us, etc.)
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="h-5 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEFAULT_PAGES.map((defaultPage) => {
            const existing = getExistingPage(defaultPage.slug);
            const hasContent = existing && existing.content;

            return (
              <div
                key={defaultPage.slug}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">
                        {defaultPage.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{defaultPage.title}</h3>
                        <p className="text-xs text-gray-400">/pages/{defaultPage.slug}</p>
                      </div>
                    </div>
                    {existing && (
                      <button
                        onClick={() => handleToggleStatus(existing)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          existing.is_active ? "bg-green-500" : "bg-gray-300"
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

                  <p className="text-sm text-gray-600 mb-4">{defaultPage.description}</p>

                  {existing ? (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-1">Content Preview:</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{getContentPreview(existing.content)}</p>
                    </div>
                  ) : (
                    <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                      <p className="text-xs text-yellow-700">Page not created yet</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {existing ? (
                      <>
                        <Link
                          href={`/admin/pages/${defaultPage.slug}`}
                          className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all text-center"
                        >
                          Edit Content
                        </Link>
                        <Link
                          href={`/pages/${defaultPage.slug}`}
                          target="_blank"
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                        >
                          Preview
                        </Link>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCreatePage(defaultPage.slug, defaultPage.title)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all"
                      >
                        Create Page
                      </button>
                    )}
                  </div>

                  {existing && (
                    <p className="text-xs text-gray-400 mt-3">
                      Last updated: {new Date(existing.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Info */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How it works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click &quot;Create Page&quot; to initialize a new CMS page</li>
              <li>• Use &quot;Edit Content&quot; to open the rich text editor</li>
              <li>• Toggle the status switch to show/hide pages on the website</li>
              <li>• Click &quot;Preview&quot; to see how the page looks to visitors</li>
              <li>• Pages are accessible at <code className="bg-blue-100 px-1 rounded">/pages/[slug]</code></li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
