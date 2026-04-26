"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const sidebarItems = getSidebarItems();

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  add_type: string;
  owner_id: number | null;
  owner_name: string | null;
  profile_image: string | null;
  cover_image: string | null;
  video_attachment: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_paid: number;
  active: number;
  priority: number | null;
  pause_note: string | null;
  cancellation_note: string | null;
  is_updated: number;
  created_at: string;
  updated_at: string;
  previousId: number | null;
  nextId: number | null;
}

export default function OwnerAdvertisementDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/owner"); return; }
    fetchAd();
  }, [id]);

  const fetchAd = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/owner/advertisements/${id}`);
      if (res.success && res.data) {
        setAd(res.data);
      } else {
        setMessage({ type: "error", text: res.message || "Advertisement not found" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async () => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      const res = await apiFetch(`/api/owner/advertisements/${id}`, { method: "DELETE" });
      if (res.success) {
        router.push("/owner/advertisements");
      } else {
        setMessage({ type: "error", text: res.message || "Failed to delete" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const pauseAd = async () => {
    try {
      const res = await apiFetch(`/api/owner/advertisements/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "paused" }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Advertisement paused!" });
        fetchAd();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const resumeAd = async () => {
    try {
      const res = await apiFetch(`/api/owner/advertisements/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.success) {
        setMessage({ type: "success", text: "✅ Submitted for re-approval!" });
        fetchAd();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  if (loading) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-10 w-10 text-emerald-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400">Loading advertisement...</p>
        </div>
      </DashboardShell>
    );
  }

  if (!ad) {
    return (
      <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Advertisement Not Found</h2>
          <Link href="/owner/advertisements" className="text-emerald-600 hover:underline">← Back to list</Link>
        </div>
      </DashboardShell>
    );
  }

  const statusLabel = () => {
    if (ad.status === "pending") return { text: "Pending Review", bg: "bg-blue-50", color: "text-blue-700", border: "border-blue-200" };
    if (ad.status === "approved" && ad.active === 1) return { text: "Running", bg: "bg-green-50", color: "text-green-700", border: "border-green-200" };
    if (ad.status === "approved" && ad.active === 2) return { text: "Scheduled", bg: "bg-purple-50", color: "text-purple-700", border: "border-purple-200" };
    if (ad.status === "paused") return { text: "Paused", bg: "bg-yellow-50", color: "text-yellow-700", border: "border-yellow-200" };
    if (ad.status === "denied") return { text: "Denied", bg: "bg-red-50", color: "text-red-700", border: "border-red-200" };
    if (ad.status === "expired" || (ad.status === "approved" && ad.active === 0)) return { text: "Expired", bg: "bg-gray-50", color: "text-gray-600", border: "border-gray-200" };
    return { text: ad.status, bg: "bg-gray-50", color: "text-gray-600", border: "border-gray-200" };
  };

  const status = statusLabel();

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{ad.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2.5 py-1 ${ad.status === "approved" && ad.active === 1 ? "bg-green-50 text-green-700 border-green-200" : ad.status === "pending" ? "bg-blue-50 text-blue-700 border-blue-200" : ad.status === "paused" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ad.status === "denied" ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"} text-[10px] font-bold rounded-full border`}>
              {status.text}
            </span>
            <span className="text-xs text-gray-400">ID: #{ad.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {["pending", "denied", "paused"].includes(ad.status) && (
            <Link href={`/owner/advertisements/${ad.id}/edit`} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          )}
          {ad.status === "approved" && ad.active === 1 && (
            <button onClick={pauseAd} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold text-sm transition-colors">
              Pause
            </button>
          )}
          {ad.status === "paused" && (
            <button onClick={resumeAd} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors">
              Resume
            </button>
          )}
          {["pending", "denied"].includes(ad.status) && (
            <button onClick={deleteAd} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">
              Delete
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {ad.previousId && (
            <Link href={`/owner/advertisements/${ad.previousId}`} className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Link>
          )}
        </div>
        <div>
          {ad.nextId && (
            <Link href={`/owner/advertisements/${ad.nextId}`} className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Advertisement Details</h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Title</p>
              <p className="text-sm font-medium text-gray-900">{ad.title}</p>
            </div>

            {ad.description && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{ad.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Type</p>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                  {ad.add_type === "video_promotion" ? "Video Promotion" : "Hostel Promotion"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Priority</p>
                <p className="text-sm font-medium text-gray-900">{ad.priority ?? "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Start Date</p>
                <p className="text-sm font-medium text-gray-900">{ad.start_date?.split("T")[0] || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">End Date</p>
                <p className="text-sm font-medium text-gray-900">{ad.end_date?.split("T")[0] || "—"}</p>
              </div>
            </div>

            {ad.video_attachment && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Video URL</p>
                <a href={ad.video_attachment} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {ad.video_attachment}
                </a>
              </div>
            )}

            {/* Admin Notes */}
            {ad.cancellation_note && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 mb-1">Admin Denial Reason</p>
                <p className="text-sm text-red-600">{ad.cancellation_note}</p>
              </div>
            )}
            {ad.pause_note && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-yellow-700 mb-1">Pause Note</p>
                <p className="text-sm text-yellow-600">{ad.pause_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Images</h3>
            <div className="space-y-4">
              {ad.profile_image ? (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Profile Image</p>
                  <img src={ad.profile_image} alt="Profile" className="w-full h-40 object-cover rounded-xl border" />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-gray-400">No profile image</span>
                </div>
              )}
              {ad.cover_image && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Cover Image</p>
                  <img src={ad.cover_image} alt="Cover" className="w-full h-40 object-cover rounded-xl border" />
                </div>
              )}
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Status Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Status</span>
                <span className={`px-2 py-1 ${status.bg} ${status.color} text-[10px] font-bold rounded-full border ${status.border}`}>
                  {status.text}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Payment</span>
                <span className={`px-2 py-1 ${ad.is_paid ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"} text-[10px] font-bold rounded-full`}>
                  {ad.is_paid ? "Paid" : "Unpaid"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Created</span>
                <span className="text-xs text-gray-700">{new Date(ad.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Updated</span>
                <span className="text-xs text-gray-700">{new Date(ad.updated_at).toLocaleDateString()}</span>
              </div>
              {ad.is_updated === 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-600 font-medium">⏳ Pending re-review after edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
