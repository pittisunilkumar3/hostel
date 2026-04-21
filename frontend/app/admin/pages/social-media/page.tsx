"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

interface SocialLink {
  id: number;
  name: string;
  link: string;
  is_active: number;
  sort_order: number;
}

// Matches reference: select dropdown options
const SOCIAL_PLATFORMS = [
  "Instagram", "Facebook", "Twitter", "LinkedIn", "Pinterest",
];

export default function SocialMediaPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string; type: string }[]>([]);

  // Form state - matches reference: name select + link input + save/update buttons
  const [selectedName, setSelectedName] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  const fetchLinks = async () => {
    try {
      const res = await apiFetch("/api/cms/social-links");
      if (res.success) setLinks(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLinks(); }, []);

  const showToast = (text: string, type: string = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Save (Add) - matches reference #add click
  const handleSave = async () => {
    if (!selectedName) { showToast("Social Name Is Required.", "error"); return; }
    if (!linkInput) { showToast("Social Link Is Required.", "error"); return; }

    setSaving(-1);
    try {
      const res = await apiFetch("/api/cms/social-links", {
        method: "POST",
        body: JSON.stringify({ name: selectedName, link: linkInput, isActive: true, sortOrder: links.length + 1 }),
      });
      if (res.success) {
        // Check if duplicate (reference returns error:1 for duplicates)
        showToast("Social Media inserted Successfully.");
        resetForm();
        fetchLinks();
      } else {
        showToast(res.message || "Failed", "error");
      }
    } catch { showToast("Network error", "error"); }
    finally { setSaving(null); }
  };

  // Update - matches reference #update click
  const handleUpdate = async () => {
    if (!editId) return;
    if (!selectedName) { showToast("Social Name Is Required.", "error"); return; }
    if (!linkInput) { showToast("Social Link Is Required.", "error"); return; }

    setSaving(editId);
    try {
      const res = await apiFetch(`/api/cms/social-links/${editId}`, {
        method: "PUT",
        body: JSON.stringify({ name: selectedName, link: linkInput }),
      });
      if (res.success) {
        showToast("Social info updated Successfully.");
        resetForm();
        fetchLinks();
      }
    } catch { showToast("Network error", "error"); }
    finally { setSaving(null); }
  };

  // Edit - matches reference .edit click
  const handleEdit = async (id: number) => {
    try {
      const res = await apiFetch(`/api/cms/social-links`);
      if (res.success) {
        const link = res.data.find((l: SocialLink) => l.id === id);
        if (link) {
          setEditId(link.id);
          setSelectedName(link.name);
          setLinkInput(link.link);
          setShowUpdate(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch { console.error; }
  };

  // Status toggle - matches reference .status change
  const handleStatusToggle = async (id: number, currentStatus: number) => {
    try {
      const res = await apiFetch(`/api/cms/social-links/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.success) {
        const link = links.find(l => l.id === id);
        const newStatus = !currentStatus;
        showToast(`${link?.name} ${newStatus ? "is Enabled!" : "is Disabled!"}`);
        fetchLinks();
      }
    } catch { showToast("Network error", "error"); }
  };

  // Delete - matches reference .delete click
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure delete this social media?`)) return;
    try {
      const res = await apiFetch(`/api/cms/social-links/${id}`, { method: "DELETE" });
      if (res.success) {
        showToast("Social media deleted Successfully.");
        fetchLinks();
      }
    } catch { showToast("Network error", "error"); }
  };

  const resetForm = () => {
    setSelectedName("");
    setLinkInput("");
    setEditId(null);
    setShowUpdate(false);
  };

  // Capitalize name like reference does with ucfirst
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <DashboardShell role="admin" title="Super Admin" items={getSidebarItems()} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${t.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Page Header - matches reference */}
      <div className="page-header mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🔗</div>
        <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
      </div>

      {/* Top Form Card - matches reference: name select + link input + save/update/reset */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="p-6">
          <form onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Select - matches reference: <select> with "---Select Social Media---" */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <select
                  value={selectedName}
                  onChange={e => setSelectedName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                >
                  <option value="">---Select Social Media---</option>
                  {SOCIAL_PLATFORMS.map(p => (
                    <option key={p} value={p.toLowerCase()}>{p}</option>
                  ))}
                </select>
              </div>
              {/* Link Input - matches reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Media Link
                  <span className="ml-1 text-gray-400 cursor-help" title="The configured social link from here will be visible in the footer section of the website.">
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </label>
                <input
                  type="text"
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  placeholder="Ex: facebook.com/your-page-name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
            </div>
            {/* Buttons - matches reference: Reset + Update(add) */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-gray-500 text-white rounded-xl text-sm font-semibold hover:bg-gray-600 transition-all"
              >
                Reset
              </button>
              {showUpdate && (
                <button
                  onClick={handleUpdate}
                  disabled={saving === editId}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {saving === editId ? "Updating..." : "Update"}
                </button>
              )}
              {!showUpdate && (
                <button
                  onClick={handleSave}
                  disabled={saving === -1}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {saving === -1 ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Table Card - matches reference: SL, Name, Social Media Link, Status, Action */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading...
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No social media links found.</p>
            <p className="text-sm mt-1">Click &quot;Save&quot; to add your first link.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sl</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Social Media Link</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {links.map((link, index) => (
                  <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* SL */}
                    <td className="px-5 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                    {/* Name - uppercase like reference */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900 uppercase">{capitalize(link.name)}</span>
                    </td>
                    {/* Social Media Link */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 break-all">{link.link}</span>
                    </td>
                    {/* Status Toggle - matches reference */}
                    <td className="px-5 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={link.is_active === 1}
                          onChange={() => handleStatusToggle(link.id, link.is_active)}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${link.is_active ? "bg-green-500" : "bg-gray-300"}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${link.is_active ? "translate-x-5" : ""}`} />
                        </div>
                      </label>
                    </td>
                    {/* Action - Edit + Delete like reference */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(link.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(link.id, link.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
