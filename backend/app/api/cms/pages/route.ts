import { getAllCmsPagesController, createCmsPageController } from "@/src/controllers/cmsController";

export async function GET() {
  return getAllCmsPagesController();
}

export async function POST(request: import("next/server").NextRequest) {
  return createCmsPageController(request);
}
