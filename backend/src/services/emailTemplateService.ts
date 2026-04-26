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

const getCompanyPhone = async (): Promise<string> => {
  try {
    const v = await getSettingValue("company_phone");
    return v || "";
  } catch { return ""; }
};

const getCompanyAddress = async (): Promise<string> => {
  try {
    const v = await getSettingValue("company_address");
    return v || "";
  } catch { return ""; }
};

// ─── Shared CSS & Footer (matches reference project exactly) ─────────

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap');
  body {
    margin: 0;
    font-family: 'Roboto', sans-serif;
    font-size: 13px;
    line-height: 21px;
    color: #737883;
    background-color: #e9ecef;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
  h1,h2,h3,h4,h5,h6 { color: #334257; }
  * { box-sizing: border-box; }
  :root { --base: #ffa726; }
  .main-table {
    width: 500px;
    background: #FFFFFF;
    margin: 0 auto;
    padding: 40px;
  }
  .main-table-td {}
  img { max-width: 100%; }
  .cmn-btn{
    background: var(--base);
    color: #fff;
    padding: 8px 20px;
    display: inline-block;
    text-decoration: none;
  }
  .mb-1 { margin-bottom: 5px; }
  .mb-2 { margin-bottom: 10px; }
  .mb-3 { margin-bottom: 15px; }
  .mb-4 { margin-bottom: 20px; }
  .mb-5 { margin-bottom: 25px; }
  hr {
    border-color: rgba(0, 170, 109, 0.3);
    margin: 16px 0;
  }
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
  }
  .copyright{
    text-align: center;
    display: block;
  }
  div { display: block; }
  a { text-decoration: none; }
  .text-base {
    color: var(--base);
    font-weight: 700;
  }
  .text-center { text-align: center; }
  .w-100 { width: 100%; }
  .bg-section { background: #E3F5F1; }
  table.bg-section { color: #334257; }
  .p-10 { padding: 10px; }
  table.bg-section tr th,
  table.bg-section tr td { padding: 5px; }
  .mail-img-1 {
    width: 140px;
    height: 60px;
    object-fit: contain;
  }
  .mail-img-2 {
    width: 130px;
    height: 45px;
    object-fit: contain;
  }
  .mail-img-3 {
    width: 100%;
    height: 172px;
    object-fit: cover;
  }
  .social img { width: 24px; }
`;

// ─── Build privacy links HTML ────────────────────────────────────────

const buildPrivacyHtml = (
  template: EmailTemplateRow,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const cmsUrl = (slug: string) => baseUrl ? `${baseUrl}/page/${slug}` : `#/page/${slug}`;
  const contactUrl = baseUrl ? `${baseUrl}/contact` : "#/contact";

  const links: string[] = [];
  if (template.privacy) {
    const slug = cmsSlugs["privacy policy"] || "privacy-policy";
    links.push(`<a href="${cmsUrl(slug)}" style="display:inline-block">Privacy Policy</a>`);
  }
  if (template.refund) {
    const slug = cmsSlugs["refund policy"] || "refund-policy";
    links.push(`<a href="${cmsUrl(slug)}" style="display:inline-block"><span></span>Refund Policy</a>`);
  }
  if (template.cancelation) {
    const slug = cmsSlugs["cancellation policy"] || "cancellation-policy";
    links.push(`<a href="${cmsUrl(slug)}" style="display:inline-block"><span></span>Cancellation Policy</a>`);
  }
  if (template.contact) {
    links.push(`<a href="${contactUrl}" style="display:inline-block"><span></span>Contact Us</a>`);
  }

  return links.length
    ? `<span class="privacy">${links.join("")}</span>`
    : "";
};

// ─── Build social media icons HTML ───────────────────────────────────

const buildSocialHtml = (
  template: EmailTemplateRow,
  socialMap: Record<string, string>
): string => {
  const socialIconMap: Record<string, string> = {
    facebook: "https://img.icons8.com/color/24/facebook.png",
    instagram: "https://img.icons8.com/color/24/instagram.png",
    twitter: "https://img.icons8.com/color/24/twitter.png",
    linkedin: "https://img.icons8.com/color/24/linkedin.png",
    pinterest: "https://img.icons8.com/color/24/pinterest.png",
  };

  const platforms = ["facebook", "instagram", "twitter", "linkedin", "pinterest"];
  const icons: string[] = [];

  for (const platform of platforms) {
    if ((template as any)[platform]) {
      const link = socialMap[platform] || "#";
      const icon = socialIconMap[platform];
      icons.push(`<a href="${link}" target="_blank" style="margin:0 5px;text-decoration:none"><img src="${icon}" alt="${platform}" /></a>`);
    }
  }

  return icons.length
    ? `<span class="social" style="text-align:center">${icons.join("")}</span>`
    : "";
};

// ─── Build button HTML ───────────────────────────────────────────────

const buildButtonHtml = (template: EmailTemplateRow): string => {
  if (!template.button_url || !template.button_name) return "";
  return `<span class="d-block text-center" style="margin-top:16px">
    <a href="${template.button_url || '#'}" class="cmn-btn">${template.button_name || 'Submit'}</a>
  </span>`;
};

// ─── Build footer section (privacy + social + copyright) ─────────────

const buildFooterSection = (
  template: EmailTemplateRow,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string,
  copyrightText: string
): string => {
  const privacyHtml = buildPrivacyHtml(template, cmsSlugs, baseUrl);
  const socialHtml = buildSocialHtml(template, socialMap);

  return `
    <tr>
      <td>
        ${privacyHtml}
        ${socialHtml}
        <span class="copyright" id="mail-copyright">${copyrightText}</span>
      </td>
    </tr>`;
};

// ─── Get image URLs ──────────────────────────────────────────────────

const getImageUrl = (path: string | null, fallback: string): string => {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = process.env.SITE_URL || "";
  return baseUrl ? `${baseUrl}/${path.replace(/^\//, "")}` : path;
};

// ─── Format Template 1: Logo → Title → Body → Banner → Button → Footer ───

const formatTemplate1 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const logoUrl = getImageUrl(template.logo, "");
  const bannerUrl = getImageUrl(template.banner_image, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <img class="mail-img-1" id="logoViewer" src="${logoUrl}" alt="logo" onerror="this.style.display='none'">
          <h2 id="mail-title" class="mt-2">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          ${bannerUrl ? `<img class="mb-2 mail-img-3" id="bannerViewer" src="${bannerUrl}" alt="banner" onerror="this.style.display='none'">` : ''}
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 2: Logo → Title → Body → Button → Footer (no banner) ───

const formatTemplate2 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const logoUrl = getImageUrl(template.logo, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <img class="mail-img-1" id="logoViewer" src="${logoUrl}" alt="logo" onerror="this.style.display='none'">
          <h2 id="mail-title" class="mt-2">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 3: Title → Body → Button → Green section → Footer ───

const formatTemplate3 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const logoUrl = getImageUrl(template.logo, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${SHARED_CSS}
    .order-table { padding: 10px; background: #fff; }
    .order-table tr td { vertical-align: top; }
    .order-table .subtitle { margin: 0; margin-bottom: 10px; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .bg-section-2 { background: #F8F9FB; }
    .p-1 { padding: 5px; }
    .p-2 { padding: 10px; }
    .px-3 { padding-inline: 15px; }
    .mb-0 { margin-bottom: 0; }
    .m-0 { margin: 0; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .mt-0 { margin-top: 0; }
  </style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <h2 class="mb-3" id="mail-title">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          ${btnHtml}
          <table class="bg-section p-10 w-100">
            <tbody>
              <tr>
                <td class="p-10">
                  <span class="d-block text-center">
                    <img class="mb-2 mail-img-2" src="${logoUrl}" alt="logo" onerror="this.style.display='none'">
                    <h3 class="mb-3 mt-0">Order Info</h3>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 4: Icon centered → Title → Body → Code → Button → Footer ───

const formatTemplate4 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string,
  replacements: Record<string, string>
): string => {
  const iconUrl = getImageUrl(template.icon, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);
  const code = replacements["code"] || replacements["otp"] || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <div class="text-center">
            <img class="mail-img-2" id="iconViewer" src="${iconUrl}" alt="icon" onerror="this.style.display='none'">
            <h2 id="mail-title" class="mt-2">${title}</h2>
            <div class="mb-1" id="mail-body">${body}</div>
            ${code ? `<h2 style="font-size:26px;margin:0;letter-spacing:4px">${code}</h2>` : ''}
          </div>
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 5: Icon centered → Title → Body → Button → Footer (simple) ───

const formatTemplate5 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const iconUrl = getImageUrl(template.icon, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <div class="text-center">
            <img class="mail-img-2" id="iconViewer" src="${iconUrl}" alt="icon" onerror="this.style.display='none'">
            <h2 id="mail-title" class="mt-2">${title}</h2>
            <div class="mb-2" id="mail-body">${body}</div>
          </div>
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 6: Icon centered → Title → Body → Transaction table → Button → Footer ───

const formatTemplate6 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string,
  replacements: Record<string, string>
): string => {
  const iconUrl = getImageUrl(template.icon, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  const transactionId = replacements["transaction_id"] || "";
  const time = replacements["time"] || "";
  const amount = replacements["amount"] || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <div class="text-center">
            <img class="mail-img-2" id="iconViewer" src="${iconUrl}" alt="icon" onerror="this.style.display='none'">
            <h2 id="mail-title" class="mt-2">${title}</h2>
            <div class="mb-2" id="mail-body">${body}</div>
          </div>
          <table class="bg-section p-10 w-100 text-center">
            <thead>
              <tr>
                <th>SL</th>
                <th>Transaction ID</th>
                <th>Time</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${transactionId}</td>
                <td>${time}</td>
                <td>${amount}</td>
              </tr>
            </tbody>
          </table>
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 7: Logo → Title → Body → Banner → Footer (no button) ───

const formatTemplate7 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const logoUrl = getImageUrl(template.logo, "");
  const bannerUrl = getImageUrl(template.banner_image, "");
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <img class="mail-img-1" id="logoViewer" src="${logoUrl}" alt="logo" onerror="this.style.display='none'">
          <h2 id="mail-title" class="mt-2">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          ${bannerUrl ? `<img class="mb-2 mail-img-3" id="bannerViewer" src="${bannerUrl}" alt="banner" onerror="this.style.display='none'">` : ''}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 8: Logo → Title → Body → Banner → Button → Footer ───

const formatTemplate8 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const logoUrl = getImageUrl(template.logo, "");
  const bannerUrl = getImageUrl(template.banner_image, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <img class="mail-img-1" id="logoViewer" src="${logoUrl}" alt="logo" onerror="this.style.display='none'">
          <h2 id="mail-title" class="mt-2">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          ${bannerUrl ? `<img class="mb-2 mail-img-3" id="bannerViewer" src="${bannerUrl}" alt="banner" onerror="this.style.display='none'">` : ''}
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 9: Title → Body → Green section → Order Info → Footer ───

const formatTemplate9 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const logoUrl = getImageUrl(template.logo, "");
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${SHARED_CSS}
    .order-table { padding: 10px; background: #fff; }
    .order-table tr td { vertical-align: top; }
    .order-table .subtitle { margin: 0; margin-bottom: 10px; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .bg-section-2 { background: #F8F9FB; }
    .p-1 { padding: 5px; }
    .p-2 { padding: 10px; }
    .px-3 { padding-inline: 15px; }
    .mb-0 { margin-bottom: 0; }
    .m-0 { margin: 0; }
    .mt-0 { margin-top: 0; }
  </style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <h2 class="mb-3" id="mail-title">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          <table class="bg-section p-10 w-100">
            <tbody>
              <tr>
                <td class="p-10">
                  <span class="d-block text-center">
                    <img class="mb-2 mail-img-2" src="${logoUrl}" alt="logo" onerror="this.style.display='none'">
                    <h3 class="mb-3 mt-0">Order Info</h3>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 10: Icon → Title → Body → Banner → Credentials → Body2 → Footer ───

const formatTemplate10 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  body2: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string,
  replacements: Record<string, string>
): string => {
  const iconUrl = getImageUrl(template.icon, "");
  const bannerUrl = getImageUrl(template.banner_image, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  const email = replacements["email"] || "";
  const password = replacements["password"] || "";

  const credentialsHtml = (email || password) ? `
    <div class="mb-1">
      Your account credentials:
      ${email ? `<h6>Email: ${email}</h6>` : ''}
      ${password ? `<h6>Password: ${password}</h6>` : ''}
    </div>` : '';

  const body2Html = body2 ? `<div class="mb-1" id="mail-body2">${body2}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <img class="mail-img-1" id="iconViewer" src="${iconUrl}" alt="icon" onerror="this.style.display='none'">
          <h2 id="mail-title" class="mt-2">${title}</h2>
          <div class="mb-1" id="mail-body">${body}</div>
          ${bannerUrl ? `<img class="mb-2 mail-img-3" id="bannerViewer" src="${bannerUrl}" alt="banner" onerror="this.style.display='none'">` : ''}
          ${btnHtml}
          ${credentialsHtml}
          ${body2Html}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Format Template 11: Icon centered → Title → Body → Button → Footer ───

const formatTemplate11 = (
  template: EmailTemplateRow,
  title: string,
  body: string,
  footerText: string,
  copyrightText: string,
  companyName: string,
  socialMap: Record<string, string>,
  cmsSlugs: Record<string, string>,
  baseUrl: string
): string => {
  const iconUrl = getImageUrl(template.icon, "");
  const btnHtml = buildButtonHtml(template);
  const footerSection = buildFooterSection(template, socialMap, cmsSlugs, baseUrl, copyrightText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body style="background-color:#e9ecef;padding:15px">
  <table class="main-table">
    <tbody>
      <tr>
        <td class="main-table-td">
          <div class="text-center">
            <img class="mail-img-2" id="iconViewer" src="${iconUrl}" alt="icon" onerror="this.style.display='none'">
            <h2 id="mail-title" class="mt-2 mb-2">${title}</h2>
          </div>
          <div class="mb-2" id="mail-body">${body}</div>
          ${btnHtml}
          <hr>
          <div class="mb-2" id="mail-footer">${footerText}</div>
          <div>Thanks &amp; Regards,</div>
          <div class="mb-4">${companyName}</div>
        </td>
      </tr>
      ${footerSection}
    </tbody>
  </table>
</body>
</html>`;
};

// ─── Main HTML Template Generation ───────────────────────────────────

const generateTemplateHTML = async (
  template: EmailTemplateRow,
  companyName: string,
  companyLogo: string,
  replacements: Record<string, string> = {}
): Promise<string> => {
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

  // Fetch real URLs from database
  const [dbSocials, cmsSlugs, companyEmail] = await Promise.all([
    getSocialLinksFromDB(),
    getCmsPageSlugs(),
    getCompanyEmail(),
  ]);

  // Build social map
  const socialMap: Record<string, string> = {};
  for (const s of dbSocials) {
    socialMap[s.name] = s.link;
  }

  const baseUrl = process.env.SITE_URL || "";

  // Get template format number (1-11), default to 5
  const formatNum = parseInt(template.email_template) || 5;

  // Route to the correct format template
  switch (formatNum) {
    case 1:
      return formatTemplate1(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 2:
      return formatTemplate2(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 3:
      return formatTemplate3(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 4:
      return formatTemplate4(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl, replacements);
    case 5:
      return formatTemplate5(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 6:
      return formatTemplate6(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl, replacements);
    case 7:
      return formatTemplate7(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 8:
      return formatTemplate8(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 9:
      return formatTemplate9(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    case 10:
      return formatTemplate10(template, title, body, body2, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl, replacements);
    case 11:
      return formatTemplate11(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
    default:
      return formatTemplate5(template, title, body, footerText, copyrightText, companyName, socialMap, cmsSlugs, baseUrl);
  }
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
