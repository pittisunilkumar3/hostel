"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

interface ContactMsg {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  reply: string | null;
  seen: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export default function ContactMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);

  const [contacts, setContacts] = useState<ContactMsg[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");
  const [viewingContact, setViewingContact] = useState<ContactMsg | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchContacts();
  }, []);

  // ==================== FETCHERS ====================
  const fetchContacts = async (page = 1, search = "") => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/contact-messages?${params}`);
      if (res.success) {
        const payload = res.data;
        if (payload?.data) {
          setContacts(payload.data);
          setContactsTotal(payload.total || 0);
          setContactsPage(payload.page || 1);
        } else {
          setContacts(Array.isArray(payload) ? payload : []);
          setContactsTotal(Array.isArray(payload) ? payload.length : 0);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const msg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };
  const clearMsg = () => setMessage(null);

  // ==================== ACTIONS ====================
  const viewContact = async (contact: ContactMsg) => {
    setViewingContact(contact);
    setReplySubject(`Re: ${contact.subject || "Your message"}`);
    setReplyBody("");
    if (!contact.seen) {
      try {
        await apiFetch(`/api/contact-messages/${contact.id}`, {
          method: "POST",
          body: JSON.stringify({ subject: "(Opened)", body: "" }),
        });
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, seen: 1 } : c));
      } catch (e) { console.error(e); }
    }
  };

  const deleteContact = async (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await apiFetch(`/api/contact-messages/${id}`, { method: "DELETE" });
      if (res.success) {
        msg("success", "✅ Message deleted successfully");
        setViewingContact(null);
        fetchContacts(contactsPage, contactSearch);
      } else {
        msg("error", res.message || "Failed to delete");
      }
    } catch { msg("error", "Network error"); }
  };

  const sendReply = async () => {
    if (!viewingContact || !replySubject || !replyBody) return;
    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/contact-messages/${viewingContact.id}`, {
        method: "POST",
        body: JSON.stringify({ subject: replySubject, body: replyBody }),
      });
      if (res.success) {
        msg("success", "✅ Reply sent successfully!");
        const updated = res.data;
        if (updated) {
          setViewingContact(updated);
        } else {
          const refetch = await apiFetch(`/api/contact-messages/${viewingContact.id}`);
          if (refetch.success && refetch.data) setViewingContact(refetch.data);
        }
        setReplyBody("");
        fetchContacts(contactsPage, contactSearch);
      } else {
        msg("error", res.message || "Failed to send reply");
      }
    } catch { msg("error", "Network error"); } finally { setSendingReply(false); }
  };

  // ==================== HELPERS ====================
  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return (
      <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
        <div className="text-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Super Admin" items={sidebarItems} accentColor="text-purple-300" accentBg="bg-gradient-to-b from-purple-900 to-purple-950" hoverBg="bg-white/10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-gray-500 text-sm">View and reply to customer messages</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}<button onClick={clearMsg} className="ml-auto"><svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>}

      {/* ===================== LIST VIEW ===================== */}
      {!viewingContact && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={contactSearch}
                onChange={e => { setContactSearch(e.target.value); fetchContacts(1, e.target.value); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
              />
            </div>
            <span className="text-sm text-gray-500 shrink-0">{contactsTotal} message{contactsTotal !== 1 ? "s" : ""}</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Message</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      No contact messages found
                    </td></tr>
                  ) : contacts.map((c, i) => (
                    <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!c.seen ? "bg-orange-50/30" : ""}`}>
                      <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {!c.seen && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0" />}
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{c.email}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-[150px] truncate">{c.subject || "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-[250px] truncate">{c.message}</td>
                      <td className="px-5 py-3 text-center">
                        {c.seen ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Replied</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">New</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => viewContact(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View & Reply">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => deleteContact(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW / REPLY ===================== */}
      {viewingContact && (
        <div className="max-w-4xl">
          <button onClick={() => setViewingContact(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to messages
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Message Details */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Contact Message</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  {viewingContact.seen ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Replied</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Not Replied Yet</span>
                  )}
                </div>
                <div><span className="text-sm text-gray-500">Name:</span> <span className="text-sm font-medium text-gray-900">{viewingContact.name}</span></div>
                <div><span className="text-sm text-gray-500">Email:</span> <span className="text-sm font-medium text-gray-900">{viewingContact.email}</span></div>
                {viewingContact.phone && <div><span className="text-sm text-gray-500">Phone:</span> <span className="text-sm font-medium text-gray-900">{viewingContact.phone}</span></div>}
                {viewingContact.subject && <div><span className="text-sm text-gray-500">Subject:</span> <span className="text-sm font-medium text-gray-900">{viewingContact.subject}</span></div>}
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Message:</span>
                  <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-800">{viewingContact.message}</div>
                </div>
                <div className="text-xs text-gray-400">{formatDateTime(viewingContact.created_at)}</div>
              </div>
            </div>

            {/* Reply Form */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Send a Reply</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" value={replySubject} onChange={e => setReplySubject(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mail Body</label>
                  <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={6} placeholder="Please send a feedback..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 resize-none" />
                </div>
                <button onClick={sendReply} disabled={sendingReply || !replySubject || !replyBody} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20">
                  {sendingReply ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                  Send Reply
                </button>
              </div>
            </div>
          </div>

          {/* Previous Reply */}
          {viewingContact.reply && (() => {
            try {
              const reply = JSON.parse(viewingContact.reply);
              if (!reply.subject && !reply.body) return null;
              return (
                <div className="mt-5 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Reply Sent</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {reply.subject && <div><span className="text-sm text-gray-500">Subject:</span> <span className="text-sm font-medium text-gray-900">{reply.subject}</span></div>}
                    {reply.body && <div><span className="text-sm text-gray-500 block mb-1">Reply:</span><div className="p-3 bg-green-50 rounded-xl text-sm text-gray-800 whitespace-pre-wrap">{reply.body}</div></div>}
                  </div>
                </div>
              );
            } catch { return null; }
          })()}
        </div>
      )}
    </DashboardShell>
  );
}
