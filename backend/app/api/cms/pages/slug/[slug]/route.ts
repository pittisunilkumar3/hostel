import { NextRequest } from "next/server";
import { getCmsPageBySlugController } from "@/src/controllers/cmsController";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return getCmsPageBySlugController(slug);
}
