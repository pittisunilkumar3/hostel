"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useI18n } from "@/lib/i18n";

const sidebarItems = getSidebarItems();

const PAGE_LABELS: Record<string, string> = {
  home: "Home Page",
  about_us: "About Us",
  contact_us: "Contact Us",
  terms_and_conditions: "Terms and Conditions",
  privacy_policy: "Privacy Policy",
  refund_policy: "Refund Policy",
  cancellation_policy: "Cancellation Policy",
  login: "Login Page",
  register: "Register Page",
  rooms: "Rooms Page",
  bookings: "Bookings Page",
  faqs: "FAQs Page",
  blog: "Blog Page",
};

interface PageInfo {
  id: number;
  page_name: string;
  has_data: boolean;
  title: string;
}

export default function PageMetaDataList() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageInfo[]>([]);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await apiFetch("/api/page-meta-data");
      if (res.success && res.data) {
        setPages(res.data.pages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell
      role="admin"
      title="Super Admin"
      items={sidebarItems}
      accentColor="text-purple-300"
      accentBg="bg-gradient-to-b from-purple-900 to-purple-950"
      hoverBg="bg-white/10"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Page SEO</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure meta tags, titles, and descriptions for each page</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h5 className="text-lg font-bold text-gray-900">SEO Setup List</h5>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20">
              <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-6 py-3 text-center font-semibold w-24">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Pages</th>
                  <th className="px-6 py-3 text-center font-semibold">Status</th>
                  <th className="px-6 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((page, idx) => (
                  <tr key={page.page_name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-center text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {PAGE_LABELS[page.page_name] || page.page_name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {page.has_data ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Configured</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase">Not Set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/page-meta-data/${page.page_name}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          page.has_data
                            ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20"
                            : "bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50"
                        }`}
                      >
                        {page.has_data ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit Content
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Content
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
