import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ===================== SOCIAL MEDIA LINKS =====================

interface SocialMediaLinkRow extends RowDataPacket {
  id: number;
  name: string;
  link: string;
  is_active: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export const getAllSocialLinks = async () => {
  const [rows] = await db.execute<SocialMediaLinkRow[]>(
    "SELECT * FROM social_media_links ORDER BY sort_order ASC, id ASC"
  );
  return rows;
};

export const getActiveSocialLinks = async () => {
  const [rows] = await db.execute<SocialMediaLinkRow[]>(
    "SELECT * FROM social_media_links WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
  );
  return rows;
};

export const getSocialLinkById = async (id: number) => {
  const [rows] = await db.execute<SocialMediaLinkRow[]>(
    "SELECT * FROM social_media_links WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createSocialLink = async (data: { name: string; link: string; isActive?: boolean; sortOrder?: number }) => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO social_media_links (name, link, is_active, sort_order) VALUES (?, ?, ?, ?)",
    [data.name, data.link, data.isActive !== false ? 1 : 0, data.sortOrder || 0]
  );
  return getSocialLinkById(result.insertId);
};

export const updateSocialLink = async (id: number, data: { name?: string; link?: string; isActive?: boolean; sortOrder?: number }) => {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.link !== undefined) { fields.push("link = ?"); values.push(data.link); }
  if (data.isActive !== undefined) { fields.push("is_active = ?"); values.push(data.isActive ? 1 : 0); }
  if (data.sortOrder !== undefined) { fields.push("sort_order = ?"); values.push(data.sortOrder); }
  if (fields.length === 0) return getSocialLinkById(id);
  values.push(id);
  await db.execute(`UPDATE social_media_links SET ${fields.join(", ")} WHERE id = ?`, values);
  return getSocialLinkById(id);
};

export const deleteSocialLink = async (id: number) => {
  await db.execute("DELETE FROM social_media_links WHERE id = ?", [id]);
  return true;
};

// ===================== CMS PAGES =====================

interface CmsPageRow extends RowDataPacket {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export const getAllCmsPages = async () => {
  const [rows] = await db.execute<CmsPageRow[]>(
    "SELECT * FROM cms_pages ORDER BY id ASC"
  );
  return rows;
};

export const getActiveCmsPages = async () => {
  const [rows] = await db.execute<CmsPageRow[]>(
    "SELECT * FROM cms_pages WHERE is_active = 1 ORDER BY id ASC"
  );
  return rows;
};

export const getCmsPageById = async (id: number) => {
  const [rows] = await db.execute<CmsPageRow[]>(
    "SELECT * FROM cms_pages WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getCmsPageBySlug = async (slug: string) => {
  const [rows] = await db.execute<CmsPageRow[]>(
    "SELECT * FROM cms_pages WHERE slug = ?",
    [slug]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const createCmsPage = async (data: { slug: string; title: string; content?: string; isActive?: boolean }) => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO cms_pages (slug, title, content, is_active) VALUES (?, ?, ?, ?)",
    [data.slug, data.title, data.content || "", data.isActive !== false ? 1 : 0]
  );
  return getCmsPageById(result.insertId);
};

export const updateCmsPage = async (id: number, data: { slug?: string; title?: string; content?: string; isActive?: boolean }) => {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.slug !== undefined) { fields.push("slug = ?"); values.push(data.slug); }
  if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
  if (data.content !== undefined) { fields.push("content = ?"); values.push(data.content); }
  if (data.isActive !== undefined) { fields.push("is_active = ?"); values.push(data.isActive ? 1 : 0); }
  if (fields.length === 0) return getCmsPageById(id);
  values.push(id);
  await db.execute(`UPDATE cms_pages SET ${fields.join(", ")} WHERE id = ?`, values);
  return getCmsPageById(id);
};

export const deleteCmsPage = async (id: number) => {
  await db.execute("DELETE FROM cms_pages WHERE id = ?", [id]);
  return true;
};
