"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/user/sidebarItems";
import { useRouter } from "next/navigation";

const sidebarItems = getSidebarItems();

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  is_read: number;
  created_at: string;
  sender_name?: string;
}

interface Conversation {
  id: number;
  user_id: number;
  hostel_id: number | null;
  owner_id: number | null;
  last_message: string | null;
  unread_count: number;
  status: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  chat_type?: "admin" | "owner";
  hostel_name?: string;
}

export default function UserMessages() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminConversation, setAdminConversation] = useState<Conversation | null>(null);
  const [ownerConversations, setOwnerConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/customer"); return; }
    setUser(u);
    fetchAllConversations();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchAllConversations = async () => {
    setLoading(true);
    try {
      // Fetch admin conversation
      const adminRes = await apiFetch("/api/support/chat?userId=" + getCurrentUser()?.id + "&chatWith=admin&userRole=customer");
      if (adminRes.success && adminRes.data?.conversation) {
        setAdminConversation({ ...adminRes.data.conversation, chat_type: "admin" });
      }

      // Fetch owner conversations
      const ownerRes = await apiFetch("/api/user/messages");
      if (ownerRes.success && ownerRes.data) {
        setOwnerConversations(ownerRes.data.map((c: Conversation) => ({ ...c, chat_type: "owner" })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/support/chat/messages?conversationId=${convId}`);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (e) { console.error(e); }
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessages([]);
    await fetchMessages(conv.id);
    // Mark as read
    await apiFetch("/api/support/chat", {
      method: "PUT",
      body: JSON.stringify({ conversationId: conv.id }),
    });
    // Update local state
    if (conv.chat_type === "admin") {
      setAdminConversation(prev => prev ? { ...prev, unread_count: 0 } : null);
    } else {
      setOwnerConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/support/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: user?.id,
          senderType: "user",
          message: newMessage.trim(),
        }),
      });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setNewMessage("");
        // Update conversation last message
        const updateConv = (c: Conversation) => ({
          ...c,
          last_message: newMessage.trim(),
          updated_at: new Date().toISOString()
        });
        if (selectedConversation.chat_type === "admin") {
          setAdminConversation(prev => prev ? updateConv(prev) : null);
        } else {
          setOwnerConversations(prev => prev.map(c =>
            c.id === selectedConversation.id ? updateConv(c) : c
          ));
        }
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const startAdminConversation = async () => {
    try {
      const res = await apiFetch("/api/support/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: 0,
          senderId: user?.id,
          senderType: "user",
          message: "Hello, I need help.",
          createNew: true,
          chatWith: "admin",
        }),
      });
      if (res.success) {
        fetchAllConversations();
      }
    } catch (e) { console.error(e); }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const adminUnread = adminConversation?.unread_count || 0;
  const totalUnreadOwner = ownerConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <DashboardShell role="user" title="Customer" items={sidebarItems} accentColor="text-blue-300" accentBg="bg-gradient-to-b from-blue-900 to-blue-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with support team and hostel owners</p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 250px)" }}>
        <div className="flex h-full">
          {/* Left Sidebar - Conversations */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Support Section */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</h3>
              <div
                onClick={() => {
                  if (adminConversation) {
                    selectConversation(adminConversation);
                  } else {
                    startAdminConversation();
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedConversation?.chat_type === "admin"
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  {adminUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {adminUnread > 9 ? "9+" : adminUnread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">Support Team</p>
                    {adminConversation && (
                      <span className="text-xs text-gray-400">{formatRelativeTime(adminConversation.updated_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{adminConversation?.last_message || "Get help from admin"}</p>
                </div>
              </div>
            </div>

            {/* Hostel Owners Section */}
            <div className="px-4 pt-2 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hostel Owners</h3>
                {totalUnreadOwner > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-semibold">
                    {totalUnreadOwner} unread
                  </span>
                )}
              </div>
            </div>

            {/* Owner Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading conversations...</p>
                </div>
              ) : ownerConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">No Hostel Owner Found</p>
                  <p className="text-xs text-gray-400 mt-1">Conversations with hostel owners will appear here</p>
                </div>
              ) : (
                ownerConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-gray-100 ${
                      selectedConversation?.id === conv.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {conv.unread_count > 9 ? "9+" : conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${conv.unread_count > 0 ? "text-gray-900" : "text-gray-700"}`}>
                          {conv.hostel_name || "Hostel Owner"}
                        </p>
                        <span className="text-xs text-gray-400">{formatRelativeTime(conv.updated_at)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Chat View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedConversation.chat_type === "admin" ? "bg-blue-100" : "bg-emerald-100"
                    }`}>
                      {selectedConversation.chat_type === "admin" ? (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedConversation.chat_type === "admin"
                          ? "Support Team"
                          : selectedConversation.hostel_name || "Hostel Owner"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.chat_type === "admin"
                          ? "Admin Support"
                          : "Hostel Owner"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.sender_id === user?.id;
                      const showDate = i === 0 || formatDate(msg.created_at) !== formatDate(messages[i - 1].created_at);
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-3">
                              <span className="text-xs text-gray-400 bg-white px-4 py-1.5 rounded-full shadow-sm">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white text-gray-900 rounded-bl-md"
                            }`}>
                              {!isMe && msg.sender_name && (
                                <p className="text-xs font-semibold text-blue-600 mb-1">{msg.sender_name}</p>
                              )}
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <p className={`text-[10px] mt-1.5 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                    >
                      {sending ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Please select a user to view the conversation</h3>
                  <p className="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
