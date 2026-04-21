import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import nodemailer from "nodemailer";
import { getSettingValue, isSettingActive } from "./settingsService";

// ─── Types ───────────────────────────────────────────────────────────
export interface EmailTemplateRow {
  id: number;
  title: string | null;
  body: string | null;
  body_2: string | null;
  icon: string | null;
  logo: string | null;
  banner_image: string | null;
  button_name: string | null;
  button_url: string | null;
  footer_text: string | null;
  copyright_text: string | null;
  email_type: string | null;
  template_type: string;
  email_template: string;
  privacy: number;
  refund: number;
  cancelation: number;
  contact: number;
  facebook: number;
  instagram: number;
  twitter: number;
  linkedin: number;
  pinterest: number;
  status: number;
  created_at: Date;
  updated_at: Date;
}

interface EmailTemplateRowPacket extends EmailTemplateRow, RowDataPacket {}

// ─── CRUD ────────────────────────────────────────────────────────────

export const getAllEmailTemplates = async (): Promise<EmailTemplateRow[]> => {
  const [rows] = await db.execute<EmailTemplateRowPacket[]>(
    "SELECT * FROM email_templates ORDER BY template_type ASC, email_type ASC"
  );
  return rows;
};

export const getEmailTemplatesByType = async (templateType: string): Promise<EmailTemplateRow[]> => {
  const [rows] = await db.execute<EmailTemplateRowPacket[]>(
    "SELECT * FROM email_templates WHERE template_type = ? ORDER BY email_type ASC",
    [templateType]
  );
  return rows;
};

export const getEmailTemplate = async (emailType: string, templateType: string): Promise<EmailTemplateRow | null> => {
  const [rows] = await db.execute<EmailTemplateRowPacket[]>(
    "SELECT * FROM email_templates WHERE email_type = ? AND template_type = ?",
    [emailType, templateType]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getEmailTemplateById = async (id: number): Promise<EmailTemplateRow | null> => {
  const [rows] = await db.execute<EmailTemplateRowPacket[]>(
    "SELECT * FROM email_templates WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createEmailTemplate = async (data: Partial<EmailTemplateRow>): Promise<EmailTemplateRow> => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO email_templates (title, body, body_2, icon, logo, banner_image, button_name, button_url, footer_text, copyright_text, email_type, template_type, email_template, privacy, refund, cancelation, contact, facebook, instagram, twitter, linkedin, pinterest, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || null, data.body || null, data.body_2 || null,
      data.icon || null, data.logo || null, data.banner_image || null,
      data.button_name || null, data.button_url || null,
      data.footer_text || null, data.copyright_text || null,
      data.email_type || null, data.template_type || "user",
      data.email_template || "5",
      data.privacy ?? 0, data.refund ?? 0, data.cancelation ?? 0, data.contact ?? 0,
      data.facebook ?? 0, data.instagram ?? 0, data.twitter ?? 0,
      data.linkedin ?? 0, data.pinterest ?? 0,
      data.status ?? 1,
    ]
  );
  const template = await getEmailTemplateById(result.insertId);
  return template!;
};

export const updateEmailTemplate = async (id: number, data: Partial<EmailTemplateRow>): Promise<EmailTemplateRow | null> => {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    "title", "body", "body_2", "icon", "logo", "banner_image",
    "button_name", "button_url", "footer_text", "copyright_text",
    "email_type", "template_type", "email_template",
    "privacy", "refund", "cancelation", "contact",
    "facebook", "instagram", "twitter", "linkedin", "pinterest", "status",
  ];

  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push((data as any)[field]);
    }
  }

  if (fields.length === 0) return getEmailTemplateById(id);

  values.push(id);
  await db.execute(
    `UPDATE email_templates SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  return getEmailTemplateById(id);
};

export const deleteEmailTemplate = async (id: number): Promise<boolean> => {
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM email_templates WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const toggleEmailTemplateStatus = async (id: number, isActive: boolean): Promise<EmailTemplateRow | null> => {
  await db.execute("UPDATE email_templates SET status = ? WHERE id = ?", [isActive ? 1 : 0, id]);
  return getEmailTemplateById(id);
};

// ─── HTML Template Generation ────────────────────────────────────────

const generateTemplateHTML = (template: EmailTemplateRow, companyName: string, companyLogo: string, replacements: Record<string, string> = {}): string => {
  // Process body with variable replacements
  let body = template.body || "";
  let body2 = template.body_2 || "";
  let footerText = template.footer_text || "Please contact us for any queries, we're always happy to help.";
  let copyrightText = template.copyright_text || `Copyright ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
  let title = template.title || "Notification";

  // Replace {{variable}} placeholders
  const replaceVars = (text: string) => {
    for (const [key, value] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
    }
    return text;
  };

  body = replaceVars(body);
  body2 = replaceVars(body2);
  footerText = replaceVars(footerText);
  copyrightText = replaceVars(copyrightText);
  title = replaceVars(title);

  const btnHtml = template.button_name ? `
    <span style="display:block;margin-top:16px;text-align:center">
      <a href="${template.button_url || "#"}" style="background:#4f46e5;color:#fff;padding:10px 28px;display:inline-block;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">${template.button_name}</a>
    </span>` : "";

  const iconHtml = template.icon ? `
    <div style="text-align:center;margin-bottom:16px">
      <img src="${template.icon}" alt="" style="width:80px;height:80px;object-fit:contain;border-radius:12px" />
    </div>` : "";

  const logoHtml = template.logo || companyLogo ? `
    <div style="text-align:center;margin-bottom:20px">
      <img src="${template.logo || companyLogo}" alt="${companyName}" style="max-width:140px;max-height:50px;object-fit:contain" />
    </div>` : "";

  const bannerHtml = template.banner_image ? `
    <div style="margin:16px 0;border-radius:8px;overflow:hidden">
      <img src="${template.banner_image}" alt="" style="width:100%;max-height:180px;object-fit:cover;display:block" />
    </div>` : "";

  const body2Html = body2 ? `
    <div style="margin-top:12px;color:#737883;font-size:13px;line-height:21px">${body2}</div>` : "";

  // Privacy / Footer links
  const privacyLinks: string[] = [];
  if (template.privacy) privacyLinks.push(`<a href="#" style="color:#334257;text-decoration:none">Privacy Policy</a>`);
  if (template.refund) privacyLinks.push(`<a href="#" style="color:#334257;text-decoration:none">Refund Policy</a>`);
  if (template.cancelation) privacyLinks.push(`<a href="#" style="color:#334257;text-decoration:none">Cancellation Policy</a>`);
  if (template.contact) privacyLinks.push(`<a href="#" style="color:#334257;text-decoration:none">Contact Us</a>`);
  const privacyHtml = privacyLinks.length
    ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:12px">${privacyLinks.join('<span style="color:#ccc">•</span>')}</div>`
    : "";

  // Social media icons
  const socialLinks: string[] = [];
  if (template.facebook) socialLinks.push(`<a href="#" style="margin:0 4px;text-decoration:none"><img src="https://img.icons8.com/color/24/facebook.png" alt="Facebook" /></a>`);
  if (template.instagram) socialLinks.push(`<a href="#" style="margin:0 4px;text-decoration:none"><img src="https://img.icons8.com/color/24/instagram.png" alt="Instagram" /></a>`);
  if (template.twitter) socialLinks.push(`<a href="#" style="margin:0 4px;text-decoration:none"><img src="https://img.icons8.com/color/24/twitter.png" alt="Twitter" /></a>`);
  if (template.linkedin) socialLinks.push(`<a href="#" style="margin:0 4px;text-decoration:none"><img src="https://img.icons8.com/color/24/linkedin.png" alt="LinkedIn" /></a>`);
  if (template.pinterest) socialLinks.push(`<a href="#" style="margin:0 4px;text-decoration:none"><img src="https://img.icons8.com/color/24/pinterest.png" alt="Pinterest" /></a>`);
  const socialHtml = socialLinks.length
    ? `<div style="margin:12px 0;text-align:center">${socialLinks.join("")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    body { margin:0;font-family:'Roboto',Arial,sans-serif;background:#e9ecef;padding:20px; }
    .main-table { width:100%;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden; }
    .content-td { padding:40px 30px 20px; }
    .footer-td { padding:10px 30px 30px;text-align:center; }
    h2 { color:#334257;margin:0 0 8px;font-size:20px;font-weight:700; }
    .body-text { color:#737883;font-size:13px;line-height:21px;margin:0 0 12px; }
    hr { border:none;border-top:1px solid rgba(0,170,109,0.2);margin:20px 0; }
    .footer-text { color:#737883;font-size:12px;line-height:18px;margin-bottom:6px; }
    .thanks { color:#334257;font-size:12px;font-weight:500; }
    .copyright { color:#aaa;font-size:11px;text-align:center;display:block;margin-top:10px; }
  </style>
</head>
<body>
  <table class="main-table">
    <tr>
      <td class="content-td">
        ${logoHtml}
        ${iconHtml}
        <h2>${title}</h2>
        <div class="body-text">${body}</div>
        ${body2Html}
        ${bannerHtml}
        ${btnHtml}
        <hr />
        <div class="footer-text">${footerText}</div>
        <div class="thanks">Thanks &amp; Regards,</div>
        <div class="thanks" style="margin-bottom:16px">${companyName}</div>
      </td>
    </tr>
    <tr>
      <td class="footer-td">
        ${privacyHtml}
        ${socialHtml}
        <span class="copyright">${copyrightText}</span>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ─── Send Templated Email ────────────────────────────────────────────

export const sendTemplatedEmail = async (
  to: string,
  emailType: string,
  templateType: string,
  replacements: Record<string, string> = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  // Check mail is active
  const mailActive = await isSettingActive("mail_is_active");
  if (!mailActive) return { success: false, error: "Mail service is disabled" };

  // Get mail config
  const host = await getSettingValue("mail_host");
  const port = await getSettingValue("mail_port");
  const username = await getSettingValue("mail_username");
  const password = await getSettingValue("mail_password");
  const encryption = await getSettingValue("mail_encryption");
  const mailerName = await getSettingValue("mail_mailer_name") || "Hostel System";
  const fromEmail = await getSettingValue("mail_email") || username;

  if (!host || !username || !password) return { success: false, error: "Mail not configured" };

  // Get template
  const template = await getEmailTemplate(emailType, templateType);
  if (!template || !template.status) return { success: false, error: `Email template '${emailType}' not found or disabled` };

  // Get company info
  const companyName = await getSettingValue("company_name") || "Hostel System";
  const companyLogo = await getSettingValue("company_logo") || "";

  // Generate HTML
  const html = generateTemplateHTML(template, companyName, companyLogo, replacements);

  // Create transporter
  const portNum = Number(port) || 465;
  const secure = encryption === "SSL" || portNum === 465;

  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure,
    auth: { user: username, pass: password },
    tls: encryption === "TLS" ? { ciphers: "SSLv3" } : undefined,
  } as any);

  // Replace vars in subject too
  let subject = template.title || "Notification";
  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }

  try {
    const info = await transporter.sendMail({
      from: `"${mailerName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ""),
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ─── Preview Template ────────────────────────────────────────────────

export const previewEmailTemplate = async (
  templateId: number,
  replacements: Record<string, string> = {}
): Promise<string> => {
  const template = await getEmailTemplateById(templateId);
  if (!template) throw new Error("Template not found");

  const companyName = await getSettingValue("company_name") || "Hostel System";
  const companyLogo = await getSettingValue("company_logo") || "";

  return generateTemplateHTML(template, companyName, companyLogo, replacements);
};
