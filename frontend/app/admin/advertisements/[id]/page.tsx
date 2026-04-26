"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";
import { useParams, useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  add_type: string;
  owner_id: number | null;
  owner_name: string | null;
  priority: number | null;
  profile_image: string | null;
  cover_image: string | null;
  video_attachment: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_paid: number;
  active: number;
  pause_note: string | null;
  cancellation_note: string | null;
  is_updated: number;
  created_by_type: string | null;
  created_at: string;
  updated_at: string;
  previousId: number | null;
  nextId: number | null;
}

export default function AdvertisementDetailsPage() {
  const [user, setUser] = useState<any>(null);
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => { setUser(getCurrentUser()); }, []);

  useEffect(() => {
    if (id) fetchAd();
  }, [id]);

  const fetchAd = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/advertisements/${id}`);
      if (res.success && res.data) {
        setAd(res.data);
      } else {
        setMessage({ type: "error", text: "Advertisement not found" });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const changeStatus = async (status: string, cancellation_note?: string) => {
    try {
      const body: any = { status };
      if (cancellation_note) body.cancellation_note = cancellation_note;
      const res = await apiFetch(`/api/advertisements/${id}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${res.message || `Status updated to ${status}`}` });
        setShowDenyModal(false);
        setDenyReason("");
        fetchAd();
      } else {
        setMessage({ type: "error", text: res.message || "Failed" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); }
  };

  const togglePaid = async () => {
    if (!ad) return;
    try {
      const res = await apiFetch(`/api/advertisements/${id}/paid-status`, {
        method: "PUT",
        body: JSON.stringify({ is_paid: ad.is_paid ? 0 : 1 }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ ${ad.is_paid ? "Marked as unpaid" : "Marked as paid"}` });
        fetchAd();
      }
    } catch {}
  };

  const changePriority = async (direction: string) => {
    try {
      const res = await apiFetch(`/api/advertisements/${id}/priority`, {
        method: "PUT",
        body: JSON.stringify({ direction }),
      });
      if (res.success) {
        setMessage({ type: "success", text: `✅ Priority moved ${direction}` });
        fetchAd();
      }
    } catch {}
  };

  const deleteAd = async () => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      const res = await apiFetch(`/api/advertisements/${id}`, { method: "DELETE" });
      if (res.success) router.push("/admin/advertisements");
    } catch {}
  };

  const statusBadge = () => {
    if (!ad) return null;
    if (ad.status === "approved" && ad.active === 1) return <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full">Running</span>;
    if (ad.status === "approved" && ad.active === 2) return <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">Scheduled</span>;
    if (ad.status === "paused") return <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full">Paused</span>;
    if (ad.status === "denied") return <span className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-full">Denied</span>;
    if (ad.status === "expired" || ad.active === 0) return <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Expired</span>;
    if (ad.status === "pending") return <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Pending</span>;
    return <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-full capitalize">{ad.status}</span>;
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20"><svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><p className="text-gray-400">Loading...</p></div>
      </DashboardShell>
    );
  }

  if (!ad) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20"><p className="text-gray-400">Advertisement not found</p></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deny Advertisement</h3>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Reason for denial (optional)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setShowDenyModal(false); setDenyReason(""); }} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
                Cancel
              </button>
              <button onClick={() => changeStatus("denied", denyReason)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl">
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push("/admin/advertisements")} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Ads Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {ad.previousId && (
            <button onClick={() => router.push(`/admin/advertisements/${ad.previousId}`)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Previous">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {ad.nextId && (
            <button onClick={() => router.push(`/admin/advertisements/${ad.nextId}`)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Next">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left info */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Ads ID #{ad.id}</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex gap-2"><span className="text-gray-400 w-24">Ad Placed</span><span className="text-gray-700 font-medium">{new Date(ad.created_at).toLocaleDateString()}</span></p>
                    <p className="flex gap-2"><span className="text-gray-400 w-24">Ad Type</span><span className="text-gray-700 font-medium capitalize">{ad.add_type.replace("_", " ")}</span></p>
                    <p className="flex gap-2"><span className="text-gray-400 w-24">Duration</span><span className="text-gray-700 font-medium">{ad.start_date?.split("T")[0]} — {ad.end_date?.split("T")[0]}</span></p>
                    <p className="flex gap-2"><span className="text-gray-400 w-24">Created By</span><span className="text-gray-700 font-medium capitalize">{ad.created_by_type || "—"}</span></p>
                    {ad.is_updated === 1 && (
                      <p className="flex gap-2">
                        <span className="text-gray-400 w-24">Updated</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Pending Re-review</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right - actions & status */}
                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {ad.status === "pending" && (
                      <>
                        <button onClick={() => setShowDenyModal(true)} className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">Deny</button>
                        <button onClick={() => changeStatus("approved")} className="px-4 py-2 border border-green-200 text-green-600 rounded-xl text-sm font-semibold hover:bg-green-50 transition-all">Approve</button>
                      </>
                    )}
                    {ad.status === "denied" && (
                      <button onClick={() => changeStatus("approved")} className="px-4 py-2 border border-green-200 text-green-600 rounded-xl text-sm font-semibold hover:bg-green-50 transition-all">Approve</button>
                    )}
                    <button onClick={() => router.push(`/admin/advertisements/create?edit=${ad.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Status:</span> {statusBadge()}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Payment:</span>
                    <span className={`font-semibold ${ad.is_paid ? "text-green-600" : "text-red-600"}`}>{ad.is_paid ? "Paid" : "Unpaid"}</span>
                  </div>
                </div>
              </div>

              <hr className="my-5" />

              {/* Title & Description */}
              <div className="mb-5">
                <h4 className="text-sm font-bold text-gray-700 mb-1">Title:</h4>
                <p className="text-gray-800">{ad.title}</p>
              </div>
              {ad.description && (
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-1">Description:</h4>
                  <p className="text-gray-600">{ad.description}</p>
                </div>
              )}

              {/* Admin Notes */}
              {ad.cancellation_note && (
                <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-700 mb-1">Denial Reason</p>
                  <p className="text-sm text-red-600">{ad.cancellation_note}</p>
                </div>
              )}
              {ad.pause_note && (
                <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Pause Note</p>
                  <p className="text-sm text-yellow-600">{ad.pause_note}</p>
                </div>
              )}

              {/* Media */}
              {ad.add_type === "video_promotion" && ad.video_attachment ? (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Video</h4>
                  <video src={ad.video_attachment} controls className="w-full max-w-lg rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ad.profile_image && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Profile Image</h4>
                      <img src={ad.profile_image} alt="" className="w-full max-w-[200px] aspect-square object-cover rounded-xl border" />
                    </div>
                  )}
                  {ad.cover_image && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Cover Image</h4>
                      <img src={ad.cover_image} alt="" className="w-full max-w-[300px] aspect-[2/1] object-cover rounded-xl border" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Ad Setup */}
        <div className="space-y-4">
          {/* Advertisement Setup Card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5">
              <h3 className="text-center font-bold text-gray-900 mb-4">Advertisement Setup</h3>

              {/* Paid Status Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-xl mb-4">
                <span className="text-sm font-medium text-gray-700">Paid Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={!!ad.is_paid} onChange={togglePaid} className="sr-only peer" />
                  <div className={`w-10 h-5 rounded-full transition-colors ${ad.is_paid ? "bg-green-500" : "bg-gray-300"}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${ad.is_paid ? "translate-x-5" : ""}`} />
                </label>
              </div>

              {/* Status Actions */}
              {ad.status === "approved" && ad.active >= 1 && (
                <div className="mb-4">
                  <button onClick={() => changeStatus("paused")} className="w-full py-2.5 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-semibold hover:bg-yellow-100 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Pause Advertisement
                  </button>
                </div>
              )}
              {ad.status === "paused" && (
                <div className="mb-4">
                  <button onClick={() => changeStatus("approved")} className="w-full py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                    Resume Advertisement
                  </button>
                </div>
              )}

              {/* Priority */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => changePriority("up")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all" title="Move Up">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <span className="flex-1 text-center text-sm font-bold text-gray-900 bg-gray-50 py-2 rounded-xl">
                    #{ad.priority ?? "—"}
                  </span>
                  <button onClick={() => changePriority("down")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all" title="Move Down">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>

              {/* Validity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validity</label>
                <div className="relative">
                  <input type="text" readOnly value={ad.start_date && ad.end_date ? `${ad.start_date.split("T")[0]} — ${ad.end_date.split("T")[0]}` : "Not set"} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Owner Info Card */}
          {ad.owner_name && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Owner Info
                </h5>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{ad.owner_name}</p>
                    <p className="text-xs text-gray-400">ID: {ad.owner_id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete */}
          <button onClick={deleteAd} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete Advertisement
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
