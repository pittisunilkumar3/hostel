import { NextRequest } from "next/server";
import { getCmsPageByIdController, updateCmsPageController, deleteCmsPageController } from "@/src/controllers/cmsController";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getCmsPageByIdController(parseInt(id));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateCmsPageController(request, parseInt(id));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteCmsPageController(parseInt(id));
}
