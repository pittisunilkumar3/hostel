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
  user_name?: string;
  user_email?: string;
}

interface SupportChatProps {
  chatWith: "admin" | "owner";
  userRole: "owner" | "customer";
  hostelId?: number;
  ownerId?: number;
}

export default function SupportChat({
  chatWith,
  userRole,
  hostelId,
  ownerId,
}: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const conversationFetched = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && !conversationFetched.current) {
      conversationFetched.current = true;
      fetchOrCreateConversation();
    }
    if (!isOpen) {
      conversationFetched.current = false;
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || !conversation) return;
    const interval = setInterval(() => {
      fetchMessages(conversation.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, conversation]);

  useEffect(() => {
    if (isOpen || !user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isOpen, user]);

  const fetchUnreadCount = async () => {
    try {
      const params = new URLSearchParams({ 
        userId: String(user?.id),
        action: "unread"
      });
      const res = await apiFetch(`/api/support/chat?${params.toString()}`);
      if (res.success && res.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchOrCreateConversation = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: String(user?.id),
        chatWith,
        userRole,
      });
      if (hostelId) params.set("hostelId", String(hostelId));
      if (ownerId) params.set("ownerId", String(ownerId));

      const res = await apiFetch(`/api/support/chat?${params.toString()}`);
      if (res.success && res.data) {
        setConversation(res.data.conversation);
        if (res.data.messages) {
          setMessages(res.data.messages);
        }
        if (res.data.conversation) {
          await apiFetch("/api/support/chat", {
            method: "PUT",
            body: JSON.stringify({ conversationId: res.data.conversation.id }),
          });
          setUnreadCount(0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await apiFetch(`/api/support/chat/messages?conversationId=${convId}`);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (e) {
      // ignore
    }
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
          senderType: userRole,
          message: newMessage.trim(),
        }),
      });
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessage("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
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

  const chatLabel = chatWith === "admin" ? "Support Team" : "Hostel Owner";
  const chatSubLabel = chatWith === "admin" ? "We typically reply within minutes" : "Contact your hostel owner";

  return (
    <div>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center justify-center"
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
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">{chatLabel}</h3>
                <p className="text-xs text-white/80">{chatSubLabel}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                const showDate = i === 0 || formatDate(msg.created_at) !== formatDate(messages[i - 1].created_at);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-2">
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMe
                          ? "bg-emerald-600 text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                      }`}>
                        {!isMe && msg.sender_name && (
                          <p className="text-xs font-semibold mb-1 text-emerald-600">{msg.sender_name}</p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>
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

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
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
    </div>
  );
}
