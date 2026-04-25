"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch, getCurrentUser } from "@/lib/auth";

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
}

type ChatTab = "admin" | "owner";

export default function CustomerSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("admin");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminUnread, setAdminUnread] = useState(0);
  const [ownerUnread, setOwnerUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const conversationFetched = useRef<{ admin: boolean; owner: boolean }>({ admin: false, owner: false });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation when tab changes or chat opens
  useEffect(() => {
    if (isOpen && user) {
      fetchConversation(activeTab);
    }
  }, [isOpen, activeTab, user]);

  // Poll for new messages
  useEffect(() => {
    if (!isOpen || !conversation) return;
    const interval = setInterval(() => {
      fetchMessages(conversation.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, conversation]);

  // Poll for unread counts when closed
  useEffect(() => {
    if (isOpen || !user) return;
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [isOpen, user]);

  const fetchUnreadCounts = async () => {
    try {
      // Admin unread
      const adminRes = await apiFetch(`/api/support/chat?userId=${user?.id}&chatWith=admin&userRole=customer`);
      if (adminRes.success && adminRes.data?.conversation) {
        setAdminUnread(adminRes.data.conversation.unread_count || 0);
      }

      // Owner unread
      const ownerRes = await apiFetch("/api/user/messages");
      if (ownerRes.success && ownerRes.data) {
        const total = ownerRes.data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
        setOwnerUnread(total);
      }
    } catch (e) { /* ignore */ }
  };

  const fetchConversation = async (tab: ChatTab) => {
    setLoading(true);
    setMessages([]);
    setConversation(null);
    try {
      if (tab === "admin") {
        const res = await apiFetch(`/api/support/chat?userId=${user?.id}&chatWith=admin&userRole=customer`);
        if (res.success && res.data) {
          setConversation(res.data.conversation);
          if (res.data.messages) setMessages(res.data.messages);
          // Mark as read
          if (res.data.conversation) {
            await apiFetch("/api/support/chat", {
              method: "PUT",
              body: JSON.stringify({ conversationId: res.data.conversation.id }),
            });
            setAdminUnread(0);
          }
        }
      } else {
        // Fetch owner conversations
        const res = await apiFetch("/api/user/messages");
        if (res.success && res.data && res.data.length > 0) {
          // Use the first owner conversation
          const conv = res.data[0];
          setConversation(conv);
          // Fetch messages
          const msgRes = await apiFetch(`/api/support/chat/messages?conversationId=${conv.id}`);
          if (msgRes.success && msgRes.data) setMessages(msgRes.data);
          // Mark as read
          await apiFetch("/api/support/chat", {
            method: "PUT",
            body: JSON.stringify({ conversationId: conv.id }),
          });
          setOwnerUnread(0);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/support/chat/messages?conversationId=${convId}`);
      if (res.success && res.data) setMessages(res.data);
    } catch (e) { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/support/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversation.id,
          senderId: user?.id,
          senderType: "user",
          message: newMessage.trim(),
        }),
      });
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setNewMessage("");
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const startConversation = async (tab: ChatTab) => {
    try {
      const res = await apiFetch("/api/support/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: 0,
          senderId: user?.id,
          senderType: "user",
          message: "Hello, I need help.",
          chatWith: tab,
          userRole: "customer",
        }),
      });
      if (res.success) fetchConversation(tab);
    } catch (e) { console.error(e); }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const totalUnread = adminUnread + ownerUnread;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {totalUnread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">Support Chat</h3>
                <p className="text-xs text-white/80">We typically reply within minutes</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-3 text-xs font-semibold transition-all relative ${
                activeTab === "admin"
                  ? "text-blue-600 bg-white border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Super Admin
              </div>
              {adminUnread > 0 && (
                <span className="absolute top-1 right-4 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {adminUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("owner")}
              className={`flex-1 py-3 text-xs font-semibold transition-all relative ${
                activeTab === "owner"
                  ? "text-blue-600 bg-white border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Hostel Owner
              </div>
              {ownerUnread > 0 && (
                <span className="absolute top-1 right-4 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {ownerUnread}
                </span>
              )}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading messages...</p>
              </div>
            ) : !conversation ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-500">No conversation yet</p>
                <button
                  onClick={() => startConversation(activeTab)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-all"
                >
                  Start Conversation
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Send a message to start chatting</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                    }`}>
                      {!isMe && msg.sender_name && (
                        <p className="text-xs font-semibold mb-1 text-blue-600">{msg.sender_name}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                disabled={sending || !conversation}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || !conversation}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
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
        </div>
      )}
    </>
  );
}
