import { NextRequest, NextResponse } from "next/server";
import {
  getHostelMetaData,
  updateHostelMetaData,
  getHostelQRData,
  updateHostelQRData,
  getBusinessSettings,
  bulkUpdateBusinessSettings,
  getHostelConversations,
  DEFAULT_BUSINESS_KEYS,
} from "../services/hostelFeatureService";
import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from "../services/helpSupportService";
import { successResponse, errorResponse } from "../utils";

// ════════════════════════════════════════════════════════════════
// META DATA
// ════════════════════════════════════════════════════════════════

export const getHostelMetaDataController = async (hostelId: number) => {
  try {
    const data = await getHostelMetaData(hostelId);
    return successResponse(data);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

export const updateHostelMetaDataController = async (hostelId: number, req: NextRequest) => {
  try {
    const body = await req.json();
    const data = await updateHostelMetaData(hostelId, body);
    return successResponse(data, "Meta data updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

// ════════════════════════════════════════════════════════════════
// QR CODE
// ════════════════════════════════════════════════════════════════

export const getHostelQRDataController = async (hostelId: number) => {
  try {
    const data = await getHostelQRData(hostelId);
    return successResponse(data);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

export const updateHostelQRDataController = async (hostelId: number, req: NextRequest) => {
  try {
    const body = await req.json();
    const data = await updateHostelQRData(hostelId, body);
    return successResponse(data, "QR code data updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

// ════════════════════════════════════════════════════════════════
// BUSINESS SETTINGS
// ════════════════════════════════════════════════════════════════

export const getBusinessSettingsController = async (hostelId: number) => {
  try {
    let settings = await getBusinessSettings(hostelId);

    // If no settings exist, seed defaults
    if (settings.length === 0) {
      const defaults: Record<string, string> = {};
      for (const k of DEFAULT_BUSINESS_KEYS) {
        defaults[k.key] = k.default;
      }
      settings = await bulkUpdateBusinessSettings(hostelId, defaults);
    }

    return successResponse({ settings, schema: DEFAULT_BUSINESS_KEYS });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

export const updateBusinessSettingsController = async (hostelId: number, req: NextRequest) => {
  try {
    const body = await req.json();
    const settings = await bulkUpdateBusinessSettings(hostelId, body);
    return successResponse(settings, "Business settings updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

// ════════════════════════════════════════════════════════════════
// CONVERSATIONS (hostel-specific)
// ════════════════════════════════════════════════════════════════

export const getHostelConversationsController = async (hostelId: number, req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const data = await getHostelConversations(hostelId, page, limit);
    return successResponse(data);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

export const getHostelConversationMessagesController = async (conversationId: number) => {
  try {
    const messages = await getConversationMessages(conversationId);
    return successResponse(messages);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

export const sendHostelConversationMessageController = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { conversationId, senderId, message } = body;

    if (!conversationId || !senderId || !message) {
      return errorResponse("conversationId, senderId, and message are required", 400);
    }

    const msg = await sendMessage({
      conversationId,
      senderId,
      senderType: "admin",
      message,
    });

    return successResponse(msg, "Message sent successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};

export const markHostelConversationReadController = async (conversationId: number) => {
  try {
    await markConversationRead(conversationId);
    return successResponse(null, "Conversation marked as read");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
};
