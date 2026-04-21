"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

type Tab = "contacts" | "conversations";

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

interface Conversation {
  id: number;
  user_id: number;
  last_message: string | null;
  unread_count: number;
  status: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_avatar: string | null;
}

interface ConvMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: "user" | "admin";
  message: string;
  is_read: number;
  created_at: string;
  sender_name: string;
}

function HelpSupportPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("contacts");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Contact Messages state
  const [contacts, setContacts] = useState<ContactMsg[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");
  const [viewingContact, setViewingContact] = useState<ContactMsg | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Read URL tab param on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "conversations") {
      setTab("conversations");
    }
  }, [searchParams]);

  useEffect(() => {
    setUser(getCurrentUser());
    Promise.all([fetchContacts(), fetchConversations()]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  // ==================== FETCHERS ====================
  const fetchContacts = async (page = 1, search = "") => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/contact-messages?${params}`);
      if (res.success) {
        // API returns { success, data: { data: [], total, page, ... } }
        const payload = res.data;
        if (payload?.data) {
          setContacts(payload.data);
          setContactsTotal(payload.total || 0);
          setContactsPage(payload.page || 1);
        } else {
          // data itself might be the array (if controller returns differently)
          setContacts(Array.isArray(payload) ? payload : []);
          setContactsTotal(Array.isArray(payload) ? payload.length : 0);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchConversations = async (search = "") => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/conversations?${params}`);
      if (res.success) {
        const payload = res.data;
        if (payload?.data) {
          setConversations(payload.data);
        } else if (Array.isArray(payload)) {
          setConversations(payload);
        } else {
          setConversations([]);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchConvMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/conversations/${convId}`);
      if (res.success) {
        const payload = res.data;
        if (Array.isArray(payload)) {
          setConvMessages(payload);
        } else if (payload?.data && Array.isArray(payload.data)) {
          setConvMessages(payload.data);
        } else {
          setConvMessages([]);
        }
      }
    } catch (e) { console.error(e); }
  };

  const msg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };
  const clearMsg = () => setMessage(null);

  // ==================== CONTACT ACTIONS ====================
  const viewContact = async (contact: ContactMsg) => {
    setViewingContact(contact);
    setReplySubject(`Re: ${contact.subject || "Your message"}`);
    setReplyBody("");
    if (!contact.seen) {
      try {
        // Mark as seen by sending a minimal reply update
        await apiFetch(`/api/contact-messages/${contact.id}`, {
          method: "POST",
          body: JSON.stringify({ subject: "(Opened)", body: "" }),
        });
        // Refresh list to update seen status
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
        // Update the viewing contact with the reply data
        const updated = res.data;
        if (updated) {
          setViewingContact(updated);
        } else {
          // Refetch the contact
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

  // ==================== CONVERSATION ACTIONS ====================
  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    await fetchConvMessages(conv.id);
    // Refresh conversations to update unread count
    fetchConversations(convSearch);
  };

  const sendMessage = async () => {
    if (!selectedConv || !newMessage.trim() || !user) return;
    setSendingMessage(true);
    try {
      const adminId = user.id || user.user_id || user.userId;
      const res = await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({
          conversationId: selectedConv.id,
          senderId: adminId,
          message: newMessage.trim(),
        }),
      });
      if (res.success) {
        setNewMessage("");
        fetchConvMessages(selectedConv.id);
        fetchConversations(convSearch);
      } else {
        msg("error", res.message || "Failed to send message");
      }
    } catch { msg("error", "Network error"); } finally { setSendingMessage(false); }
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

  const getInitials = (name: string) => {
    return name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
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
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help &amp; Support</h1>
            <p className="text-gray-500 text-sm">Manage contact messages and customer conversations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => { setTab("contacts"); clearMsg(); setViewingContact(null); }} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === "contacts" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Contact Messages
          {contacts.filter(c => !c.seen).length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{contacts.filter(c => !c.seen).length}</span>}
        </button>
        <button onClick={() => { setTab("conversations"); clearMsg(); }} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === "conversations" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Conversations
          {conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}</span>}
        </button>
      </div>

      {/* Message */}
      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}<button onClick={clearMsg} className="ml-auto"><svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>}

      {/* ===================== TAB 1: CONTACT MESSAGES ===================== */}
      {tab === "contacts" && !viewingContact && (
        <div>
          {/* Search */}
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

          {/* Table */}
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

      {/* ===================== CONTACT VIEW / REPLY ===================== */}
      {tab === "contacts" && viewingContact && (
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

      {/* ===================== TAB 2: CONVERSATIONS ===================== */}
      {tab === "conversations" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col shrink-0 ${selectedConv ? "hidden lg:flex" : "flex"}`}>
              {/* Search */}
              <div className="p-3 border-b border-gray-50">
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={convSearch}
                    onChange={e => { setConvSearch(e.target.value); fetchConversations(e.target.value); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${selectedConv?.id === conv.id ? "bg-orange-50 border-l-2 border-l-orange-500" : ""}`}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                      {getInitials(conv.user_name || "U")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.user_name || "Unknown"}</p>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatDate(conv.updated_at)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 truncate">{conv.last_message || "No messages yet"}</p>
                        {(conv.unread_count || 0) > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full shrink-0">{conv.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedConv ? "flex" : "hidden lg:flex"}`}>
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <button onClick={() => setSelectedConv(null)} className="lg:hidden text-gray-500 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                      {getInitials(selectedConv.user_name || "U")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedConv.user_name}</p>
                      <p className="text-[11px] text-gray-400">{selectedConv.user_email}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                    {convMessages.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : convMessages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.sender_type === "admin" ? "bg-orange-600 text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"}`}>
                          <p className="text-sm leading-relaxed">{m.message}</p>
                          <p className={`text-[10px] mt-1 ${m.sender_type === "admin" ? "text-orange-200" : "text-gray-400"}`}>{formatDateTime(m.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Send Message */}
                  <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="p-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all shrink-0"
                      >
                        {sendingMessage ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <p className="text-gray-400 text-sm">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// Wrap with Suspense for useSearchParams support in Next.js App Router
export default function HelpSupportPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>}>
      <HelpSupportPage />
    </Suspense>
  );
}
