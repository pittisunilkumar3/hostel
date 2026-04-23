import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { getSettingValue } from "./settingsService";

// ============================================================
// Types
// ============================================================
interface PushNotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  image: string | null;
  data: string | null;
  is_read: number;
  type: string;
  created_at: Date;
}

interface FCMMessage {
  title: string;
  body: string;
  image?: string;
  data?: Record<string, string>;
}

// ============================================================
// Lazy-loaded Firebase Admin app (singleton)
// ============================================================
let firebaseApp: any = null;

async function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const serviceFileContent = await getSettingValue("push_notification_service_file_content");
  if (!serviceFileContent) {
    console.warn("[Push] No Firebase service file content configured");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceFileContent);
    const admin = await import("firebase-admin");
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[Push] Firebase Admin initialized");
    return firebaseApp;
  } catch (error: any) {
    console.error("[Push] Firebase Admin init error:", error.message);
    firebaseApp = null;
    return null;
  }
}

// ============================================================
// Send push notification to a single user
// ============================================================
export async function sendPushNotification(
  userId: number,
  message: FCMMessage,
  type: string = "general"
): Promise<{ success: boolean; notificationId?: number }> {
  try {
    // 1. Save notification to database
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO push_notifications (user_id, title, body, image, data, type) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        message.title,
        message.body || "",
        message.image || null,
        message.data ? JSON.stringify(message.data) : null,
        type,
      ]
    );

    // 2. Get user's FCM token
    const [users] = await db.execute<RowDataPacket[]>(
      "SELECT fcm_token FROM users WHERE id = ?",
      [userId]
    );

    if (!users.length || !users[0].fcm_token) {
      console.log(`[Push] No FCM token for user ${userId}, notification saved to DB only`);
      return { success: true, notificationId: result.insertId };
    }

    const fcmToken = users[0].fcm_token as string;

    // 3. Send via Firebase Admin
    const app = await getFirebaseApp();
    if (!app) {
      console.log(`[Push] Firebase not configured, notification saved to DB only`);
      return { success: true, notificationId: result.insertId };
    }

    const admin = await import("firebase-admin");
    const messaging = admin.messaging(app);

    const payload: any = {
      notification: {
        title: message.title,
        body: message.body || "",
        ...(message.image ? { image: message.image } : {}),
      },
      token: fcmToken,
      ...(message.data ? { data: message.data } : {}),
    };

    await messaging.send(payload);
    console.log(`[Push] Sent to user ${userId}: "${message.title}"`);

    return { success: true, notificationId: result.insertId };
  } catch (error: any) {
    console.error(`[Push] Error sending to user ${userId}:`, error.message);
    // If token is invalid, clear it
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      await db.execute("UPDATE users SET fcm_token = NULL WHERE id = ?", [userId]);
      console.log(`[Push] Cleared invalid FCM token for user ${userId}`);
    }
    return { success: false };
  }
}

// ============================================================
// Send push notification to all users of a role
// ============================================================
export async function sendPushNotificationByRole(
  role: "SUPER_ADMIN" | "OWNER" | "CUSTOMER",
  message: FCMMessage,
  type: string = "general"
): Promise<void> {
  const [users] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE role = ?",
    [role]
  );

  for (const user of users) {
    await sendPushNotification(user.id, message, type);
  }
}

// ============================================================
// Send push notification to multiple users
// ============================================================
export async function sendPushNotificationToUsers(
  userIds: number[],
  message: FCMMessage,
  type: string = "general"
): Promise<void> {
  for (const userId of userIds) {
    await sendPushNotification(userId, message, type);
  }
}

// ============================================================
// Register / Update FCM token for a user
// ============================================================
export async function registerFCMToken(
  userId: number,
  fcmToken: string
): Promise<void> {
  await db.execute("UPDATE users SET fcm_token = ? WHERE id = ?", [fcmToken, userId]);
}

// ============================================================
// Unregister FCM token for a user
// ============================================================
export async function unregisterFCMToken(userId: number): Promise<void> {
  await db.execute("UPDATE users SET fcm_token = NULL WHERE id = ?", [userId]);
}

// ============================================================
// Get notification history for a user
// ============================================================
export async function getUserNotifications(
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: PushNotificationRow[]; total: number; unread: number }> {
  const offset = (page - 1) * limit;

  const [notifications] = await db.execute<PushNotificationRow[]>(
    "SELECT * FROM push_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [userId, limit, offset]
  );

  const [countRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM push_notifications WHERE user_id = ?",
    [userId]
  );

  const [unreadRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as unread FROM push_notifications WHERE user_id = ? AND is_read = 0",
    [userId]
  );

  return {
    notifications,
    total: (countRows[0] as any).total,
    unread: (unreadRows[0] as any).unread,
  };
}

// ============================================================
// Mark a notification as read
// ============================================================
export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<void> {
  await db.execute(
    "UPDATE push_notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
}

// ============================================================
// Mark all notifications as read for a user
// ============================================================
export async function markAllNotificationsAsRead(
  userId: number
): Promise<void> {
  await db.execute(
    "UPDATE push_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
    [userId]
  );
}

// ============================================================
// Delete a notification
// ============================================================
export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<void> {
  await db.execute(
    "DELETE FROM push_notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId]
  );
}

// ============================================================
// Clear all notifications for a user
// ============================================================
export async function clearAllNotifications(userId: number): Promise<void> {
  await db.execute("DELETE FROM push_notifications WHERE user_id = ?", [userId]);
}

// ============================================================
// Check if push notification is enabled for a specific event
// ============================================================
export async function isPushNotificationEnabled(
  key: string,
  type: string
): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT push_notification_status FROM notification_settings WHERE `key` = ? AND type = ?",
    [key, type]
  );
  return rows.length > 0 && (rows[0] as any).push_notification_status === "ACTIVE";
}
