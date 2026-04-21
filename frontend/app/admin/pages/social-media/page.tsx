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

const SOCIAL_PLATFORMS = [
  "Facebook", "Instagram", "Twitter", "LinkedIn", "Pinterest",
  "YouTube", "WhatsApp", "Telegram", "TikTok", "Snapchat",
  "Reddit", "Tumblr", "Discord", "GitHub", "Other"
];

export default function SocialMediaPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLink, setNewLink] = useState("");

  // Edit form
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLink, setEditLink] = useState("");

  const fetchLinks = async () => {
    try {
      const res = await apiFetch("/api/cms/social-links");
      if (res.success) setLinks(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLinks(); }, []);

  const msg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAdd = async () => {
    if (!newName || !newLink) { msg("error", "Name and Link are required"); return; }
    setSaving(-1);
    try {
      const res = await apiFetch("/api/cms/social-links", {
        method: "POST",
        body: JSON.stringify({ name: newName, link: newLink, isActive: true, sortOrder: links.length + 1 }),
      });
      if (res.success) {
        msg("success", "✅ Social media link added!");
        setShowAddForm(false);
        setNewName("");
        setNewLink("");
        fetchLinks();
      } else msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); }
    finally { setSaving(null); }
  };

  const handleUpdate = async (id: number) => {
    if (!editName || !editLink) { msg("error", "Name and Link are required"); return; }
    setSaving(id);
    try {
      const res = await apiFetch(`/api/cms/social-links/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName, link: editLink }),
      });
      if (res.success) {
        msg("success", "✅ Updated!");
        setEditId(null);
        fetchLinks();
      } else msg("error", res.message || "Failed");
    } catch { msg("error", "Network error"); }
    finally { setSaving(null); }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    setSaving(id);
    try {
      const res = await apiFetch(`/api/cms/social-links/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      });
      if (res.success) {
        msg("success", `✅ ${isActive ? "Activated" : "Deactivated"}!`);
        fetchLinks();
      }
    } catch { msg("error", "Network error"); }
    finally { setSaving(null); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setSaving(id);
    try {
      const res = await apiFetch(`/api/cms/social-links/${id}`, { method: "DELETE" });
      if (res.success) {
        msg("success", "✅ Deleted!");
        fetchLinks();
      }
    } catch { msg("error", "Network error"); }
    finally { setSaving(null); }
  };

  const startEdit = (link: SocialLink) => {
    setEditId(link.id);
    setEditName(link.name);
    setEditLink(link.link);
  };

  const getPlatformIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("facebook")) return "📘";
    if (n.includes("instagram")) return "📸";
    if (n.includes("twitter")) return "🐦";
    if (n.includes("linkedin")) return "💼";
    if (n.includes("pinterest")) return "📌";
    if (n.includes("youtube")) return "🎬";
    if (n.includes("whatsapp")) return "💬";
    if (n.includes("telegram")) return "✈️";
    if (n.includes("tiktok")) return "🎵";
    if (n.includes("snapchat")) return "👻";
    if (n.includes("reddit")) return "🔴";
    if (n.includes("tumblr")) return "📝";
    if (n.includes("discord")) return "🎮";
    if (n.includes("github")) return "🐙";
    return "🔗";
  };

  return (
    <DashboardShell role="admin" title="Super Admin" items={getSidebarItems()} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media Links</h1>
          <p className="text-gray-500 mt-1">Manage your social media links displayed on the website</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Social Media
        </button>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-2xl border border-indigo-100 p-6 shadow-lg shadow-indigo-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Social Media Link</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Social Media <span className="text-red-500">*</span></label>
              <select
                value={newName}
                onChange={e => { setNewName(e.target.value); if (e.target.value === "Other") setNewName(""); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              >
                <option value="">---Select Social Media---</option>
                {SOCIAL_PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {newName === "Other" && (
                <input
                  type="text"
                  placeholder="Enter platform name"
                  value={newName === "Other" ? "" : newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full mt-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Link <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={newLink}
                onChange={e => setNewLink(e.target.value)}
                placeholder="Ex: facebook.com/your-page-name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving === -1}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving === -1 ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              Save
            </button>
            <button onClick={() => { setShowAddForm(false); setNewName(""); setNewLink(""); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Links Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Loading...
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No social media links found.</p>
            <p className="text-sm mt-1">Click &quot;Add Social Media&quot; to add your first link.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sl</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Social Media Link</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {links.map((link, index) => (
                  <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-5 py-4">
                      {editId === link.id ? (
                        <select
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="">---Select Social Media---</option>
                          {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPlatformIcon(link.name)}</span>
                          <span className="text-sm font-semibold text-gray-900">{link.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {editId === link.id ? (
                        <input
                          type="url"
                          value={editLink}
                          onChange={e => setEditLink(e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      ) : (
                        <a href={link.link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                          {link.link}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggle(link.id, !link.is_active)}
                        disabled={saving === link.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${link.is_active ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${link.is_active ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editId === link.id ? (
                          <>
                            <button onClick={() => handleUpdate(link.id)} disabled={saving === link.id} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
                              {saving === link.id ? "..." : "Save"}
                            </button>
                            <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(link)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(link.id, link.name)} disabled={saving === link.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
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
