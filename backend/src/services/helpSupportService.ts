import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ===================== TYPES =====================
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  reply: string | null;
  seen: number;
  status: number;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: number;
  user_id: number;
  last_message: string | null;
  unread_count: number;
  status: number;
  created_at: Date;
  updated_at: Date;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_avatar?: string;
}

export interface ConversationMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: "user" | "admin";
  message: string;
  is_read: number;
  created_at: Date;
  sender_name?: string;
}

// ===================== CONTACT MESSAGES =====================

export const getContactMessages = async (search?: string, page = 1, limit = 20) => {
  let query = "SELECT * FROM contact_messages WHERE 1=1";
  const params: any[] = [];

  if (search) {
    query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  // Count total
  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
  const [countRows] = await db.execute<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, (page - 1) * limit);

  const [rows] = await db.execute<RowDataPacket[]>(query, params);
  return {
    data: rows as ContactMessage[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getContactMessageById = async (id: number) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM contact_messages WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? (rows[0] as ContactMessage) : null;
};

export const createContactMessage = async (data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)",
    [data.name, data.email, data.phone || null, data.subject || null, data.message]
  );
  return getContactMessageById(result.insertId);
};

export const markContactMessageSeen = async (id: number) => {
  await db.execute("UPDATE contact_messages SET seen = 1 WHERE id = ?", [id]);
  return getContactMessageById(id);
};

export const replyToContactMessage = async (id: number, replyData: { subject: string; body: string }) => {
  await db.execute(
    "UPDATE contact_messages SET reply = ?, seen = 1 WHERE id = ?",
    [JSON.stringify(replyData), id]
  );
  return getContactMessageById(id);
};

export const deleteContactMessage = async (id: number) => {
  await db.execute("DELETE FROM contact_messages WHERE id = ?", [id]);
};

export const getContactMessageStats = async () => {
  const [totalRows] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as total FROM contact_messages");
  const [unreadRows] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as total FROM contact_messages WHERE seen = 0");
  const [repliedRows] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as total FROM contact_messages WHERE seen = 1");
  return {
    total: totalRows[0]?.total || 0,
    unread: unreadRows[0]?.total || 0,
    replied: repliedRows[0]?.total || 0,
  };
};

// ===================== CONVERSATIONS =====================

export const getConversations = async (search?: string, page = 1, limit = 20) => {
  let baseWhere = " WHERE c.status = 1";
  const params: any[] = [];

  if (search) {
    baseWhere += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  // Count total with a clean query
  const countQuery = `SELECT COUNT(*) as total FROM conversations c LEFT JOIN users u ON c.user_id = u.id${baseWhere}`;
  const [countRows] = await db.execute<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Main query
  const mainQuery = `
    SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.avatar as user_avatar
    FROM conversations c
    LEFT JOIN users u ON c.user_id = u.id
    ${baseWhere}
    ORDER BY c.updated_at DESC LIMIT ? OFFSET ?
  `;
  const mainParams = [...params, limit, (page - 1) * limit];

  const [rows] = await db.execute<RowDataPacket[]>(mainQuery, mainParams);
  return {
    data: rows as Conversation[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getConversationById = async (id: number) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.avatar as user_avatar
     FROM conversations c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
    [id]
  );
  return rows.length > 0 ? (rows[0] as Conversation) : null;
};

export const getOrCreateConversation = async (userId: number) => {
  // Check if conversation exists
  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM conversations WHERE user_id = ? AND status = 1",
    [userId]
  );
  if (existing.length > 0) return existing[0] as Conversation;

  // Create new
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO conversations (user_id) VALUES (?)",
    [userId]
  );
  return getConversationById(result.insertId);
};

export const getConversationMessages = async (conversationId: number) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT cm.*, u.name as sender_name
     FROM conversation_messages cm
     LEFT JOIN users u ON cm.sender_id = u.id
     WHERE cm.conversation_id = ?
     ORDER BY cm.created_at ASC`,
    [conversationId]
  );
  return rows as ConversationMessage[];
};

export const sendMessage = async (data: {
  conversationId: number;
  senderId: number;
  senderType: "user" | "admin";
  message: string;
}) => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)",
    [data.conversationId, data.senderId, data.senderType, data.message]
  );

  // Update conversation last message
  await db.execute(
    "UPDATE conversations SET last_message = ?, updated_at = NOW() WHERE id = ?",
    [data.message.substring(0, 200), data.conversationId]
  );

  // If admin sends, reset unread count; if user sends, increment
  if (data.senderType === "user") {
    await db.execute("UPDATE conversations SET unread_count = unread_count + 1 WHERE id = ?", [data.conversationId]);
  } else {
    await db.execute("UPDATE conversations SET unread_count = 0 WHERE id = ?", [data.conversationId]);
  }

  // Mark messages as read
  if (data.senderType === "admin") {
    await db.execute(
      "UPDATE conversation_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'user'",
      [data.conversationId]
    );
  }

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT cm.*, u.name as sender_name FROM conversation_messages cm LEFT JOIN users u ON cm.sender_id = u.id WHERE cm.id = ?`,
    [result.insertId]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const markConversationRead = async (conversationId: number) => {
  await db.execute("UPDATE conversations SET unread_count = 0 WHERE id = ?", [conversationId]);
  await db.execute(
    "UPDATE conversation_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'user'",
    [conversationId]
  );
};

export const getConversationStats = async () => {
  const [totalRows] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as total FROM conversations WHERE status = 1");
  const [unreadRows] = await db.execute<RowDataPacket[]>("SELECT SUM(unread_count) as total FROM conversations WHERE status = 1 AND unread_count > 0");
  return {
    total: totalRows[0]?.total || 0,
    unread: unreadRows[0]?.total || 0,
  };
};
