import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

// GET /api/email-templates?type=user|admin  OR  /api/email-templates (all)
export async function getEmailTemplatesController(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get("type");

    const { getAllEmailTemplates, getEmailTemplatesByType } = await import("../services/emailTemplateService");

    if (templateType) {
      const templates = await getEmailTemplatesByType(templateType);
      return successResponse(templates, "Templates fetched");
    }

    const templates = await getAllEmailTemplates();
    return successResponse(templates, "Templates fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/email-templates/[id]
export async function getEmailTemplateController(id: number) {
  try {
    const { getEmailTemplateById } = await import("../services/emailTemplateService");
    const template = await getEmailTemplateById(id);
    if (!template) return errorResponse("Template not found", 404);
    return successResponse(template, "Template fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/email-templates
export async function createEmailTemplateController(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.email_type) return errorResponse("email_type is required", 400);

    const { createEmailTemplate } = await import("../services/emailTemplateService");
    const template = await createEmailTemplate(body);
    return successResponse(template, "Template created", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/email-templates/[id]
export async function updateEmailTemplateController(id: number, request: NextRequest) {
  try {
    const body = await request.json();
    const { updateEmailTemplate } = await import("../services/emailTemplateService");
    const template = await updateEmailTemplate(id, body);
    if (!template) return errorResponse("Template not found", 404);
    return successResponse(template, "Template updated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PATCH /api/email-templates/[id]/toggle
export async function toggleEmailTemplateController(id: number, request: NextRequest) {
  try {
    const { is_active } = await request.json();
    const { toggleEmailTemplateStatus } = await import("../services/emailTemplateService");
    const template = await toggleEmailTemplateStatus(id, !!is_active);
    if (!template) return errorResponse("Template not found", 404);
    return successResponse(template, `Template ${is_active ? "activated" : "deactivated"}`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /api/email-templates/[id]
export async function deleteEmailTemplateController(id: number) {
  try {
    const { deleteEmailTemplate } = await import("../services/emailTemplateService");
    const deleted = await deleteEmailTemplate(id);
    if (!deleted) return errorResponse("Template not found", 404);
    return successResponse(null, "Template deleted");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/email-templates/[id]/preview
export async function previewEmailTemplateController(id: number, request: NextRequest) {
  try {
    const body = await request.json();
    const replacements = body.replacements || {};
    const { previewEmailTemplate } = await import("../services/emailTemplateService");
    const html = await previewEmailTemplate(id, replacements);
    return successResponse({ html }, "Preview generated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/email-templates/send
export async function sendTemplatedEmailController(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, email_type, template_type, replacements } = body;
    if (!to || !email_type) return errorResponse("to and email_type are required", 400);

    const { sendTemplatedEmail } = await import("../services/emailTemplateService");
    const result = await sendTemplatedEmail(to, email_type, template_type || "user", replacements || {});
    if (!result.success) return errorResponse(result.error || "Failed to send email", 500);
    return successResponse({ messageId: result.messageId }, "Email sent successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
