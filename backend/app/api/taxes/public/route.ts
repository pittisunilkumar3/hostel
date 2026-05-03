import { successResponse, errorResponse } from "@/src/utils";
import * as taxService from "@/src/services/taxService";

// GET /api/taxes/public — Public: get active taxes for price calculation
export async function GET() {
  try {
    const taxes = await taxService.getAllTaxes(true); // active only
    const config = await taxService.getTaxConfigurations();

    const taxInclusive = config.find((c: any) => c.config_key === "tax_inclusive")?.config_value === "1";

    return successResponse({
      taxes: taxes.map((t: any) => ({
        id: t.id,
        name: t.name,
        rate: Number(t.rate),
        type: t.type,
      })),
      tax_inclusive: taxInclusive,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
