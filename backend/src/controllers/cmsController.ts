import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

// ===================== SOCIAL MEDIA LINKS =====================

export async function getAllSocialLinksController() {
  try {
    const { getAllSocialLinks } = await import("../services/cmsService");
    return successResponse(await getAllSocialLinks(), "Social links fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getActiveSocialLinksController() {
  try {
    const { getActiveSocialLinks } = await import("../services/cmsService");
    return successResponse(await getActiveSocialLinks(), "Active social links fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function createSocialLinkController(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.link) return errorResponse("Name and Link are required", 400);
    const { createSocialLink } = await import("../services/cmsService");
    return successResponse(await createSocialLink(body), "Social link created");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function updateSocialLinkController(request: NextRequest, id: number) {
  try {
    const body = await request.json();
    const { updateSocialLink } = await import("../services/cmsService");
    return successResponse(await updateSocialLink(id, body), "Social link updated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function deleteSocialLinkController(id: number) {
  try {
    const { deleteSocialLink } = await import("../services/cmsService");
    return successResponse(await deleteSocialLink(id), "Social link deleted");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ===================== CMS PAGES =====================

export async function getAllCmsPagesController() {
  try {
    const { getAllCmsPages } = await import("../services/cmsService");
    return successResponse(await getAllCmsPages(), "CMS pages fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getActiveCmsPagesController() {
  try {
    const { getActiveCmsPages } = await import("../services/cmsService");
    return successResponse(await getActiveCmsPages(), "Active CMS pages fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getCmsPageByIdController(id: number) {
  try {
    const { getCmsPageById } = await import("../services/cmsService");
    const page = await getCmsPageById(id);
    if (!page) return errorResponse("Page not found", 404);
    return successResponse(page, "CMS page fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function getCmsPageBySlugController(slug: string) {
  try {
    const { getCmsPageBySlug } = await import("../services/cmsService");
    const page = await getCmsPageBySlug(slug);
    if (!page) return errorResponse("Page not found", 404);
    return successResponse(page, "CMS page fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function createCmsPageController(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.slug || !body.title) return errorResponse("Slug and Title are required", 400);
    const { createCmsPage } = await import("../services/cmsService");
    return successResponse(await createCmsPage(body), "CMS page created");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function updateCmsPageController(request: NextRequest, id: number) {
  try {
    const body = await request.json();
    const { updateCmsPage } = await import("../services/cmsService");
    return successResponse(await updateCmsPage(id, body), "CMS page updated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function deleteCmsPageController(id: number) {
  try {
    const { deleteCmsPage } = await import("../services/cmsService");
    return successResponse(await deleteCmsPage(id), "CMS page deleted");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
