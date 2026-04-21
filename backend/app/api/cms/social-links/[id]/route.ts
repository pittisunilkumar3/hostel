import { NextRequest } from "next/server";
import { updateSocialLinkController, deleteSocialLinkController } from "@/src/controllers/cmsController";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateSocialLinkController(request, parseInt(id));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteSocialLinkController(parseInt(id));
}
