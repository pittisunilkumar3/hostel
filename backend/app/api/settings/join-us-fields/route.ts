import { NextRequest, NextResponse } from "next/server";
import { getSettingValue } from "@/src/services/settingsService";
import { successResponse } from "@/src/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "owner";
    const key = `join_us_page_data_${type}`;
    const raw = await getSettingValue(key);

    if (!raw) {
      return successResponse([]);
    }

    const parsed = JSON.parse(raw);
    const fields = (parsed.data || []).map((item: any) => ({
      name: item.input_data?.replace(/\s+/g, "_").toLowerCase() || "",
      label: item.input_data || "",
      type: mapFieldType(item.field_type),
      required: item.is_required === 1 || item.is_required === true,
      options: item.check_data || [],
    }));

    return successResponse(fields);
  } catch {
    return successResponse([]);
  }
}

function mapFieldType(type: string): string {
  const map: Record<string, string> = {
    text: "text",
    number: "number",
    date: "date",
    email: "email",
    phone: "tel",
    file: "file",
    check_box: "checkbox",
  };
  return map[type] || "text";
}
