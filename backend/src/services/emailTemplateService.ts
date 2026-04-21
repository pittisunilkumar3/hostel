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

// ─── Database helpers for URLs ───────────────────────────────────────

interface SocialLinkRow extends RowDataPacket { id: number; name: string; link: string; is_active: number; }
interface CmsPageRow extends RowDataPacket { id: number; title: string; slug: string; }

const getSocialLinksFromDB = async (): Promise<{ name: string; link: string }[]> => {
  try {
    const [rows] = await db.execute<SocialLinkRow[]>("SELECT name, link FROM social_media_links WHERE is_active = 1 ORDER BY sort_order ASC, id ASC");
    return rows.map(r => ({ name: r.name.toLowerCase().trim(), link: r.link }));
  } catch { return []; }
};

const getCmsPageSlugs = async (): Promise<Record<string, string>> => {
  try {
    const [rows] = await db.execute<CmsPageRow[]>("SELECT title, slug FROM cms_pages");
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.title.toLowerCase().trim()] = r.slug;
    }
    return map;
  } catch { return {}; }
};

const getCompanyEmail = async (): Promise<string> => {
  try {
    const v = await getSettingValue("company_email");
    return v || "support@example.com";
  } catch { return "support@example.com"; }
};

// ─── HTML Template Generation (async — fetches real URLs from DB) ────

const generateTemplateHTML = async (template: EmailTemplateRow, companyName: string, companyLogo: string, replacements: Record<string, string> = {}): Promise<string> => {
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

  // ─── Fetch real URLs from database ───────────────────────
  const [dbSocials, cmsSlugs, companyEmail] = await Promise.all([
    getSocialLinksFromDB(),
    getCmsPageSlugs(),
    getCompanyEmail(),
  ]);

  // Build a lookup: lowercase platform name → link
  const socialMap: Record<string, string> = {};
  for (const s of dbSocials) {
    socialMap[s.name] = s.link;
  }

  // Build CMS page URLs using slug
  const baseUrl = process.env.SITE_URL || "";
  const cmsUrl = (slug: string) => baseUrl ? `${baseUrl}/page/${slug}` : `#/page/${slug}`;
  const contactUrl = baseUrl ? `${baseUrl}/contact` : "#/contact";

  // Privacy / Footer links — from CMS pages table
  const privacyLinks: string[] = [];
  if (template.privacy) {
    const slug = cmsSlugs["privacy policy"] || "privacy-policy";
    privacyLinks.push(`<a href="${cmsUrl(slug)}" style="color:#334257;text-decoration:none">Privacy Policy</a>`);
  }
  if (template.refund) {
    const slug = cmsSlugs["refund policy"] || "refund-policy";
    privacyLinks.push(`<a href="${cmsUrl(slug)}" style="color:#334257;text-decoration:none"><span style="width:6px;height:6px;border-radius:50%;background:#334257;display:inline-block;margin:0 7px"></span>Refund Policy</a>`);
  }
  if (template.cancelation) {
    const slug = cmsSlugs["cancellation policy"] || "cancellation-policy";
    privacyLinks.push(`<a href="${cmsUrl(slug)}" style="color:#334257;text-decoration:none"><span style="width:6px;height:6px;border-radius:50%;background:#334257;display:inline-block;margin:0 7px"></span>Cancellation Policy</a>`);
  }
  if (template.contact) {
    privacyLinks.push(`<a href="${contactUrl}" style="color:#334257;text-decoration:none"><span style="width:6px;height:6px;border-radius:50%;background:#334257;display:inline-block;margin:0 7px"></span>Contact Us</a>`);
  }
  const privacyHtml = privacyLinks.length
    ? `<span class="privacy">${privacyLinks.join("")}</span>`
    : "";

  // Social media icons — from social_media_links table
  const socialIconMap: Record<string, string> = {
    facebook: "https://img.icons8.com/color/24/facebook.png",
    instagram: "https://img.icons8.com/color/24/instagram.png",
    twitter: "https://img.icons8.com/color/24/twitter.png",
    linkedin: "https://img.icons8.com/color/24/linkedin.png",
    pinterest: "https://img.icons8.com/color/24/pinterest.png",
  };
  const socialLinks: string[] = [];
  const platforms = ["facebook", "instagram", "twitter", "linkedin", "pinterest"];
  for (const platform of platforms) {
    if ((template as any)[platform]) {
      const dbLink = socialMap[platform] || socialMap[platform.replace("facebook", "facebook")] || "#";
      const icon = socialIconMap[platform];
      socialLinks.push(`<a href="${dbLink}" target="_blank" style="margin:0 4px;text-decoration:none"><img src="${icon}" alt="${platform}" /></a>`);
    }
  }
  const socialHtml = socialLinks.length
    ? `<span class="social">${socialLinks.join("")}</span>`
    : "";

  const btnHtml = template.button_name ? `
    <span class="d-block" style="text-align:center;margin-top:16px">
      <a href="${template.button_url || "#"}" style="background:#4f46e5;color:#fff;padding:10px 28px;display:inline-block;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">${template.button_name}</a>
    </span>` : "";

  const iconHtml = template.icon ? `
    <div style="text-align:center;margin-bottom:8px">
      <img src="${template.icon}" alt="" style="width:130px;height:45px;object-fit:contain" />
    </div>` : `<div style="text-align:center;margin-bottom:8px">
      <img src="" alt="" style="width:130px;height:45px;object-fit:contain" onerror="this.style.display='none'" />
    </div>`;

  const bannerHtml = template.banner_image ? `
    <div style="margin:16px 0;border-radius:8px;overflow:hidden">
      <img src="${template.banner_image}" alt="" style="width:100%;max-height:180px;object-fit:cover;display:block" />
    </div>` : "";

  const body2Html = body2 ? `
    <div style="margin-bottom:14px;color:#737883;font-size:13px;line-height:21px">${body2}</div>` : "";

  // Company logo at bottom of email (fallback to template logo or business logo)
  const bottomLogoHtml = `
    <div style="text-align:center;margin:10px 0">
      <img src="${template.logo || companyLogo || ''}" alt="${companyName}" style="width:120px;display:block;margin:0 auto;object-fit:contain" onerror="this.style.display='none'" />
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    body {
      font-family: 'Roboto', Arial, sans-serif;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #e9ecef;
      color: #737883;
      font-size: 13px;
      line-height: 21px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    table { border-collapse: collapse !important; }
    a { text-decoration: none; }
    .border-top {
      border-top: 1px solid rgba(0, 170, 109, 0.3);
      padding: 15px 0 10px;
      display: block;
    }
    .d-block { display: block; }
    .privacy {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
    }
    .privacy a {
      text-decoration: none;
      color: #334257;
      position: relative;
      margin-left: auto;
      margin-right: auto;
      font-size: 12px;
    }
    .privacy a span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #334257;
      display: inline-block;
      margin: 0 7px;
    }
    .social {
      margin: 15px 0 8px;
      display: block;
      text-align: center;
    }
    .social img { width: 24px; }
    .copyright {
      text-align: center;
      display: block;
      color: #aaa;
      font-size: 11px;
    }
  </style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table style="width:100%;max-width:500px;margin:0 auto;text-align:center;background:#fff">
    <tr>
      <td style="padding:30px 30px 0">
        ${iconHtml}
        <h3 style="font-size:17px;font-weight:500;color:#334257;margin:8px 0 0" id="mail-title">${title}</h3>
      </td>
    </tr>
    <tr>
      <td style="padding:0 30px 30px;text-align:left">
        <span style="font-weight:500;display:block;margin:20px 0 11px;color:#737883;font-size:13px;line-height:21px">${body}</span>
        ${body2Html}
        ${bannerHtml}
        ${btnHtml}
        <span class="border-top"></span>
        <span class="d-block" style="margin-bottom:14px;color:#737883;font-size:13px;line-height:18px">${footerText}</span>
        <span class="d-block" style="color:#334257;font-size:13px;font-weight:500">Thanks &amp; Regards,</span>
        <span class="d-block" style="color:#334257;font-size:13px;font-weight:500;margin-bottom:20px">${companyName}</span>
        ${bottomLogoHtml}
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
  const html = await generateTemplateHTML(template, companyName, companyLogo, replacements);

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

  return await generateTemplateHTML(template, companyName, companyLogo, replacements);
};
