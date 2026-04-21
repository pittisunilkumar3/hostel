import { getAllSocialLinksController, createSocialLinkController } from "@/src/controllers/cmsController";

export async function GET() {
  return getAllSocialLinksController();
}

export async function POST(request: import("next/server").NextRequest) {
  return createSocialLinkController(request);
}
