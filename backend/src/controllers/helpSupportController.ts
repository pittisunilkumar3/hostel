import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

// ===================== CONTACT MESSAGES =====================

export async function getContactMessagesController(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const { getContactMessages } = await import("../services/helpSupportService");
    const result = await getContactMessages(search, page, limit);
    return successResponse(result, "Contact messages fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getContactMessageByIdController(id: number) {
  try {
    const { getContactMessageById } = await import("../services/helpSupportService");
    const msg = await getContactMessageById(id);
    if (!msg) return errorResponse("Contact message not found", 404);
    return successResponse(msg, "Contact message fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function createContactMessageController(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return errorResponse("Name, email and message are required", 400);
    }

    const { createContactMessage } = await import("../services/helpSupportService");
    const result = await createContactMessage({ name, email, phone, subject, message });
    return successResponse(result, "Message sent successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function deleteContactMessageController(id: number) {
  try {
    const { getContactMessageById, deleteContactMessage } = await import("../services/helpSupportService");
    const msg = await getContactMessageById(id);
    if (!msg) return errorResponse("Contact message not found", 404);
    await deleteContactMessage(id);
    return successResponse(null, "Contact message deleted");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function replyContactMessageController(request: NextRequest, id: number) {
  try {
    const { subject, body } = await request.json();
    if (!subject || !body) {
      return errorResponse("Subject and body are required", 400);
    }

    const { getContactMessageById, replyToContactMessage } = await import("../services/helpSupportService");
    const msg = await getContactMessageById(id);
    if (!msg) return errorResponse("Contact message not found", 404);

    await replyToContactMessage(id, { subject, body });

    // Try to send email reply
    try {
      const { getSettingValue } = await import("../services/settingsService");
      const host = await getSettingValue("mail_host");
      const port = await getSettingValue("mail_port");
      const username = await getSettingValue("mail_username");
      const password = await getSettingValue("mail_password");
      const encryption = await getSettingValue("mail_encryption");
      const mailerName = await getSettingValue("mail_mailer_name") || "Hostel System";
      const fromEmail = await getSettingValue("mail_email") || username;

      if (host && username && password) {
        const nodemailer = await import("nodemailer");
        const portNum = Number(port) || 465;
        const secure = encryption === "SSL" || portNum === 465;

        const transporter = nodemailer.createTransport({
          host, port: portNum, secure,
          auth: { user: username, pass: password },
          tls: encryption === "TLS" ? { ciphers: "SSLv3" } : undefined,
        });

        await transporter.sendMail({
          from: `"${mailerName}" <${fromEmail}>`,
          to: msg.email,
          subject,
          html: `<p>Hello ${msg.name},</p><p>${body.replace(/\n/g, "<br>")}</p><p>Best regards,<br/>${mailerName} Support Team</p>`,
          text: `Hello ${msg.name},\n\n${body}\n\nBest regards,\n${mailerName} Support Team`,
        });
      }
    } catch (mailErr: any) {
      console.error("Mail send error:", mailErr.message);
      // Still return success - reply is saved even if mail fails
    }

    const updated = await getContactMessageById(id);
    return successResponse(updated, "Reply sent successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getContactStatsController() {
  try {
    const { getContactMessageStats } = await import("../services/helpSupportService");
    return successResponse(await getContactMessageStats(), "Stats fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ===================== CONVERSATIONS =====================

export async function getConversationsController(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const { getConversations } = await import("../services/helpSupportService");
    const result = await getConversations(search, page, limit);
    return successResponse(result, "Conversations fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getConversationMessagesController(conversationId: number) {
  try {
    const { getConversationMessages, markConversationRead } = await import("../services/helpSupportService");
    const messages = await getConversationMessages(conversationId);
    await markConversationRead(conversationId);
    return successResponse(messages, "Messages fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function sendConversationMessageController(request: NextRequest) {
  try {
    const { conversationId, senderId, message } = await request.json();
    if (!conversationId || !senderId || !message) {
      return errorResponse("Conversation ID, sender ID and message are required", 400);
    }

    const { sendMessage } = await import("../services/helpSupportService");
    const result = await sendMessage({
      conversationId,
      senderId,
      senderType: "admin",
      message,
    });
    return successResponse(result, "Message sent", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getConversationStatsController() {
  try {
    const { getConversationStats } = await import("../services/helpSupportService");
    return successResponse(await getConversationStats(), "Stats fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
