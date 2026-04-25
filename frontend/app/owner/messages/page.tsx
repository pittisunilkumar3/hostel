"use client";

import { useEffect, useState, useRef } from "react";
import DashboardShell from "@/app/components/DashboardShell";
import { apiFetch, getCurrentUser } from "@/lib/auth";
import { getSidebarItems } from "@/app/owner/sidebarItems";
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
  user_phone?: string;
  user_avatar?: string;
}

type TabType = "admin" | "customers";

export default function OwnerMessages() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("admin");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.push("/login/owner"); return; }
    setUser(u);
    fetchConversations();
  }, [router, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/owner/messages?tab=${activeTab}`);
      if (res.success && res.data) {
        setConversations(res.data);
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
    await fetchMessages(conv.id);
    // Mark as read
    await apiFetch("/api/support/chat", {
      method: "PUT",
      body: JSON.stringify({ conversationId: conv.id }),
    });
    // Update local state
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
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
          senderType: "owner",
          message: newMessage.trim(),
        }),
      });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setNewMessage("");
        // Update conversation last message
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, last_message: newMessage.trim(), updated_at: new Date().toISOString() }
            : c
        ));
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
          senderType: "owner",
          message: "Hello, I need assistance.",
          createNew: true,
          chatWith: "admin",
        }),
      });
      if (res.success) {
        fetchConversations();
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

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.user_name?.toLowerCase().includes(query) ||
      conv.user_email?.toLowerCase().includes(query) ||
      conv.last_message?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardShell role="owner" title="Hostel Owner" items={sidebarItems} accentColor="text-emerald-300" accentBg="bg-gradient-to-b from-emerald-900 to-emerald-950" hoverBg="bg-white/10">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with support team and customers</p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 250px)" }}>
        <div className="flex h-full">
          {/* Left Sidebar - Conversations */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Admin Support Section */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</h3>
              <div
                onClick={() => {
                  setActiveTab("admin");
                  const adminConv = conversations.find(c => !c.owner_id && !c.hostel_id);
                  if (adminConv) {
                    selectConversation(adminConv);
                  } else {
                    startAdminConversation();
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedConversation && !selectedConversation.owner_id && !selectedConversation.hostel_id
                    ? "bg-emerald-50 border border-emerald-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Support Team</p>
                  <p className="text-xs text-gray-500 truncate">Get help from admin</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-2">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "customers"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Customers
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-gray-500">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isAdmin = !conv.owner_id && !conv.hostel_id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                        selectedConversation?.id === conv.id
                          ? "bg-emerald-50 border border-emerald-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAdmin ? "bg-emerald-100" : "bg-blue-100"
                        }`}>
                          {isAdmin ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
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
                            {isAdmin ? "Support Team" : conv.user_name || "Customer"}
                          </p>
                          <span className="text-xs text-gray-400">{formatRelativeTime(conv.updated_at)}</span>
                        </div>
                        <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side - Chat View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      !selectedConversation.owner_id && !selectedConversation.hostel_id
                        ? "bg-emerald-100"
                        : "bg-blue-100"
                    }`}>
                      {!selectedConversation.owner_id && !selectedConversation.hostel_id ? (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {!selectedConversation.owner_id && !selectedConversation.hostel_id
                          ? "Support Team"
                          : selectedConversation.user_name || "Customer"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {!selectedConversation.owner_id && !selectedConversation.hostel_id
                          ? "Admin Support"
                          : selectedConversation.user_email || "Customer"}
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
                                ? "bg-emerald-600 text-white rounded-br-md"
                                : "bg-white text-gray-900 rounded-bl-md"
                            }`}>
                              {!isMe && msg.sender_name && (
                                <p className="text-xs font-semibold text-emerald-600 mb-1">{msg.sender_name}</p>
                              )}
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <p className={`text-[10px] mt-1.5 ${isMe ? "text-emerald-200" : "text-gray-400"}`}>
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
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
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
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Conversation</h3>
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
