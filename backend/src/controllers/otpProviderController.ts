import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";
import {
  getAllOTPProviders,
  getOTPProviderById,
  updateOTPProvider,
  toggleOTPProvider,
  createOTPProvider,
  deleteOTPProvider,
  getActiveOTPProvider,
} from "../services/otpProviderService";

// GET /api/otp-providers — list all providers
export async function getOTPProvidersController() {
  try {
    const providers = await getAllOTPProviders();
    const active = await getActiveOTPProvider();

    // Parse config JSON for each provider
    const parsed = providers.map((p) => ({
      ...p,
      config: typeof p.config === "string" ? JSON.parse(p.config) : p.config,
    }));

    return successResponse(
      { providers: parsed, activeProvider: active?.slug || null },
      "OTP providers fetched"
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/otp-providers/status — public: which provider is active?
export async function getOTPProviderStatusController() {
  try {
    const active = await getActiveOTPProvider();
    if (!active) {
      return successResponse({ active: false, provider: null }, "No active OTP provider");
    }

    const config: Record<string, string> =
      typeof active.config === "string" ? JSON.parse(active.config) : active.config;

    // For Firebase, expose api_key publicly
    const publicConfig: Record<string, string | null> = {};
    if (active.provider_type === "firebase") {
      publicConfig.api_key = config.api_key || null;
      publicConfig.project_id = config.project_id || null;
    }

    return successResponse(
      {
        active: true,
        provider: active.slug,
        providerType: active.provider_type,
        name: active.name,
        config: publicConfig,
      },
      "OTP provider status"
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/otp-providers/[id] — get single provider
export async function getOTPProviderController(id: number) {
  try {
    const provider = await getOTPProviderById(id);
    if (!provider) return errorResponse("Provider not found", 404);
    const parsed = {
      ...provider,
      config: typeof provider.config === "string" ? JSON.parse(provider.config) : provider.config,
    };
    return successResponse(parsed, "Provider fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/otp-providers/[id] — update a provider (config, toggle, etc.)
export async function updateOTPProviderController(request: NextRequest, id: number) {
  try {
    const body = await request.json();

    const provider = await getOTPProviderById(id);
    if (!provider) return errorResponse("Provider not found", 404);

    const updated = await updateOTPProvider(id, {
      name: body.name,
      description: body.description,
      logo_url: body.logo_url,
      color: body.color,
      config: body.config,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    if (!updated) return errorResponse("Failed to update provider", 500);

    const parsed = {
      ...updated,
      config: typeof updated.config === "string" ? JSON.parse(updated.config) : updated.config,
    };

    return successResponse(parsed, "Provider updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PATCH /api/otp-providers/[id]/toggle — toggle provider active status
export async function toggleOTPProviderController(request: NextRequest, id: number) {
  try {
    const body = await request.json();
    const isActive = !!body.is_active;

    const provider = await getOTPProviderById(id);
    if (!provider) return errorResponse("Provider not found", 404);

    const updated = await toggleOTPProvider(id, isActive);
    if (!updated) return errorResponse("Failed to toggle provider", 500);

    const parsed = {
      ...updated,
      config: typeof updated.config === "string" ? JSON.parse(updated.config) : updated.config,
    };

    return successResponse(parsed, `Provider ${isActive ? "activated" : "deactivated"}`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/otp-providers — create a new provider
export async function createOTPProviderController(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.slug || !body.provider_type) {
      return errorResponse("name, slug, and provider_type are required", 400);
    }

    const provider = await createOTPProvider({
      name: body.name,
      slug: body.slug,
      provider_type: body.provider_type,
      description: body.description,
      logo_url: body.logo_url,
      color: body.color,
      config: body.config,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    if (!provider) return errorResponse("Failed to create provider", 500);

    const parsed = {
      ...provider,
      config: typeof provider.config === "string" ? JSON.parse(provider.config) : provider.config,
    };

    return successResponse(parsed, "Provider created successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /api/otp-providers/[id] — delete a provider
export async function deleteOTPProviderController(id: number) {
  try {
    const deleted = await deleteOTPProvider(id);
    if (!deleted) return errorResponse("Provider not found or could not delete", 404);
    return successResponse(null, "Provider deleted");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
