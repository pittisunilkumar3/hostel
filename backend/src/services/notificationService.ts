import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ============================================================
// Notification Settings
// ============================================================
export interface NotificationSettingRow extends RowDataPacket {
  id: number;
  title: string;
  sub_title: string | null;
  key: string;
  type: "ADMIN" | "OWNER" | "CUSTOMER";
  mail_status: "ACTIVE" | "INACTIVE" | "DISABLE";
  sms_status: "ACTIVE" | "INACTIVE" | "DISABLE";
  push_notification_status: "ACTIVE" | "INACTIVE" | "DISABLE";
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// Notification Messages
// ============================================================
export interface NotificationMessageRow extends RowDataPacket {
  id: number;
  key: string;
  message: string | null;
  status: number;
  user_type: "CUSTOMER" | "OWNER";
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// Default notification settings data (adapted from reference)
// ============================================================
function getDefaultNotificationSettings(): Array<{
  title: string;
  sub_title: string;
  key: string;
  type: "ADMIN" | "OWNER" | "CUSTOMER";
  mail_status: "ACTIVE" | "INACTIVE" | "DISABLE";
  sms_status: "ACTIVE" | "INACTIVE" | "DISABLE";
  push_notification_status: "ACTIVE" | "INACTIVE" | "DISABLE";
}> {
  return [
    // ---- ADMIN ----
    { title: "Forgot Password", sub_title: "Sent notification on forgot password", key: "forgot_password", type: "ADMIN", mail_status: "ACTIVE", sms_status: "ACTIVE", push_notification_status: "DISABLE" },
    { title: "Customer Registration", sub_title: "Sent notification on customer registration", key: "customer_registration", type: "ADMIN", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "DISABLE" },
    { title: "Owner Registration", sub_title: "Sent notification on owner registration", key: "owner_registration", type: "ADMIN", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "DISABLE" },
    { title: "New Booking", sub_title: "Sent notification on new booking", key: "new_booking", type: "ADMIN", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Booking Cancelled", sub_title: "Sent notification on booking cancellation", key: "booking_cancelled", type: "ADMIN", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Payment Received", sub_title: "Sent notification on payment received", key: "payment_received", type: "ADMIN", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Contact Message", sub_title: "Sent notification on contact message", key: "contact_message", type: "ADMIN", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "DISABLE" },

    // ---- OWNER ----
    { title: "Owner Registration Approval", sub_title: "Sent notification on owner registration approval", key: "owner_registration_approval", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "DISABLE" },
    { title: "Owner Registration Deny", sub_title: "Sent notification on owner registration denied", key: "owner_registration_deny", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "DISABLE" },
    { title: "Owner Account Block", sub_title: "Sent notification on owner account block", key: "owner_account_block", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Owner Account Unblock", sub_title: "Sent notification on owner account unblock", key: "owner_account_unblock", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Owner New Booking", sub_title: "Sent notification on new booking to owner", key: "owner_new_booking", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Owner Booking Cancelled", sub_title: "Sent notification on booking cancellation to owner", key: "owner_booking_cancelled", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Owner Payment Received", sub_title: "Sent notification on payment received to owner", key: "owner_payment_received", type: "OWNER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Owner Forgot Password", sub_title: "Sent notification on owner forgot password", key: "owner_forgot_password", type: "OWNER", mail_status: "ACTIVE", sms_status: "ACTIVE", push_notification_status: "DISABLE" },

    // ---- CUSTOMER ----
    { title: "Customer Registration", sub_title: "Sent notification on customer registration", key: "customer_registration", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "DISABLE" },
    { title: "Customer Booking Confirmed", sub_title: "Sent notification on booking confirmed", key: "customer_booking_confirmed", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Customer Booking Cancelled", sub_title: "Sent notification on booking cancelled", key: "customer_booking_cancelled", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Customer Payment Success", sub_title: "Sent notification on payment success", key: "customer_payment_success", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Customer Forgot Password", sub_title: "Sent notification on customer forgot password", key: "customer_forgot_password", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "ACTIVE", push_notification_status: "DISABLE" },
    { title: "Customer Account Block", sub_title: "Sent notification on customer account block", key: "customer_account_block", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Customer Account Unblock", sub_title: "Sent notification on customer account unblock", key: "customer_account_unblock", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Customer Booking Reminder", sub_title: "Sent notification on booking check-in reminder", key: "customer_booking_reminder", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
    { title: "Customer Checkout Reminder", sub_title: "Sent notification on checkout reminder", key: "customer_checkout_reminder", type: "CUSTOMER", mail_status: "ACTIVE", sms_status: "DISABLE", push_notification_status: "ACTIVE" },
  ];
}

// ============================================================
// Default notification message keys (per user type)
// ============================================================
export function getNotificationMessageKeys(
  userType: "CUSTOMER" | "OWNER"
): Record<string, string> {
  if (userType === "OWNER") {
    return {
      "Owner Registration Approval": "owner_registration_approval",
      "Owner Registration Deny": "owner_registration_deny",
      "Owner Account Block": "owner_account_block",
      "Owner Account Unblock": "owner_account_unblock",
      "Owner New Booking": "owner_new_booking",
      "Owner Booking Cancelled": "owner_booking_cancelled",
      "Owner Payment Received": "owner_payment_received",
      "Owner Forgot Password": "owner_forgot_password",
    };
  }
  return {
    "Booking Confirmed": "customer_booking_confirmed",
    "Booking Cancelled": "customer_booking_cancelled",
    "Payment Success": "customer_payment_success",
    "Forgot Password": "customer_forgot_password",
    "Account Block": "customer_account_block",
    "Account Unblock": "customer_account_unblock",
    "Booking Reminder": "customer_booking_reminder",
    "Checkout Reminder": "customer_checkout_reminder",
    "Registration": "customer_registration",
  };
}

// ============================================================
// Seed default notification settings if table is empty
// ============================================================
export async function seedNotificationSettings(): Promise<void> {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM notification_settings"
  );
  if (rows[0].cnt > 0) return;

  const defaults = getDefaultNotificationSettings();
  for (const item of defaults) {
    await db.execute(
      `INSERT INTO notification_settings (title, sub_title, \`key\`, type, mail_status, sms_status, push_notification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        item.title,
        item.sub_title,
        item.key,
        item.type,
        item.mail_status,
        item.sms_status,
        item.push_notification_status,
      ]
    );
  }
}

// ============================================================
// Get notification settings filtered by type
// ============================================================
export async function getNotificationSettings(
  type?: "ADMIN" | "OWNER" | "CUSTOMER"
): Promise<NotificationSettingRow[]> {
  if (type) {
    const [rows] = await db.execute<NotificationSettingRow[]>(
      "SELECT * FROM notification_settings WHERE type = ? ORDER BY id ASC",
      [type]
    );
    return rows;
  }
  const [rows] = await db.execute<NotificationSettingRow[]>(
    "SELECT * FROM notification_settings ORDER BY id ASC"
  );
  return rows;
}

// ============================================================
// Toggle notification setting channel status
// ============================================================
export async function toggleNotificationSetting(
  key: string,
  type: string,
  channel: "mail" | "sms" | "push_notification"
): Promise<NotificationSettingRow | null> {
  const column =
    channel === "mail"
      ? "mail_status"
      : channel === "sms"
        ? "sms_status"
        : "push_notification_status";

  const [existing] = await db.execute<NotificationSettingRow[]>(
    "SELECT * FROM notification_settings WHERE `key` = ? AND type = ?",
    [key, type]
  );
  if (existing.length === 0) return null;

  const current = existing[0][column] as string;
  const newStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await db.execute(
    `UPDATE notification_settings SET ${column} = ? WHERE \`key\` = ? AND type = ?`,
    [newStatus, key, type]
  );

  const [updated] = await db.execute<NotificationSettingRow[]>(
    "SELECT * FROM notification_settings WHERE `key` = ? AND type = ?",
    [key, type]
  );
  return updated[0] || null;
}

// ============================================================
// Get notification messages filtered by user type
// ============================================================
export async function getNotificationMessages(
  userType: "CUSTOMER" | "OWNER"
): Promise<NotificationMessageRow[]> {
  const [rows] = await db.execute<NotificationMessageRow[]>(
    "SELECT * FROM notification_messages WHERE user_type = ? ORDER BY id ASC",
    [userType]
  );
  return rows;
}

// ============================================================
// Update / create notification messages (bulk)
// ============================================================
export async function updateNotificationMessages(
  userType: "CUSTOMER" | "OWNER",
  messages: Array<{ key: string; message: string; status: boolean }>
): Promise<void> {
  for (const msg of messages) {
    await db.execute(
      `INSERT INTO notification_messages (\`key\`, message, status, user_type)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE message = VALUES(message), status = VALUES(status)`,
      [msg.key, msg.message, msg.status ? 1 : 0, userType]
    );
  }
}

// ============================================================
// Get a single notification message
// ============================================================
export async function getNotificationMessage(
  key: string,
  userType: string
): Promise<NotificationMessageRow | null> {
  const [rows] = await db.execute<NotificationMessageRow[]>(
    "SELECT * FROM notification_messages WHERE `key` = ? AND user_type = ?",
    [key, userType]
  );
  return rows.length > 0 ? rows[0] : null;
}
