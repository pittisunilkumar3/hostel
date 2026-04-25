"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/admin/sidebarItems";

const sidebarItems = getSidebarItems();

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
  user_role?: string;
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

export default function ConversationsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    fetchConversations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  const fetchConversations = async (search = "") => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await apiFetch(`/api/conversations?${params}`);
      if (res.success) {
        const payload = res.data;
        if (payload?.data) setConversations(payload.data);
        else if (Array.isArray(payload)) setConversations(payload);
        else setConversations([]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchConvMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/conversations/${convId}`);
      if (res.success) {
        const payload = res.data;
        if (Array.isArray(payload)) setConvMessages(payload);
        else if (payload?.data && Array.isArray(payload.data)) setConvMessages(payload.data);
        else setConvMessages([]);
      }
    } catch (e) { console.error(e); }
  };

  const clearMsg = () => setMessage(null);

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    await fetchConvMessages(conv.id);
    fetchConversations(convSearch);
  };

  const sendMessage = async () => {
    if (!selectedConv || !newMessage.trim() || !user) return;
    setSendingMessage(true);
    try {
      const adminId = user.id || user.user_id || user.userId;
      const res = await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ conversationId: selectedConv.id, senderId: adminId, message: newMessage.trim() }),
      });
      if (res.success) {
        setNewMessage("");
        fetchConvMessages(selectedConv.id);
        fetchConversations(convSearch);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to send" });
      }
    } catch { setMessage({ type: "error", text: "Network error" }); } finally { setSendingMessage(false); }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d); const now = new Date(); const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getInitials = (name: string) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

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
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
            <p className="text-gray-500 text-sm">Chat with users and hostel owners in real-time</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}<button onClick={clearMsg} className="ml-auto"><svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>}

      {/* Chat Layout */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col shrink-0 ${selectedConv ? "hidden lg:flex" : "flex"}`}>
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by name..." value={convSearch} onChange={e => { setConvSearch(e.target.value); fetchConversations(e.target.value); }} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : conversations.map(conv => (
                <button key={conv.id} onClick={() => selectConversation(conv)} className={`w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${selectedConv?.id === conv.id ? "bg-orange-50 border-l-2 border-l-orange-500" : ""}`}>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      conv.user_role === "OWNER" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {getInitials(conv.user_name || "U")}
                    </div>
                    {conv.user_role === "OWNER" && (
                      <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{conv.user_name || "Unknown"}</p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatDate(conv.updated_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{conv.last_message || "No messages yet"}</p>
                      {(conv.unread_count || 0) > 0 && <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full shrink-0">{conv.unread_count}</span>}
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
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                  <button onClick={() => setSelectedConv(null)} className="lg:hidden text-gray-500 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">{getInitials(selectedConv.user_name || "U")}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedConv.user_name}</p>
                    <p className="text-[11px] text-gray-400">{selectedConv.user_email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                  {convMessages.length === 0 ? (
                    <div className="text-center py-16 text-gray-400"><p className="text-sm">No messages yet. Start the conversation!</p></div>
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

                {/* Send */}
                <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
                    <button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} className="p-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all shrink-0">
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
    </DashboardShell>
  );
}
