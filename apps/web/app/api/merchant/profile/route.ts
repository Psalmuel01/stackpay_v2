import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import {
  getMerchantProfileByWallet,
  upsertMerchantProfile,
} from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  const walletAddress = request.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress) {
    return jsonError(400, "invalid_request", "walletAddress is required.");
  }

  try {
    const merchant = await getMerchantProfileByWallet(walletAddress);
    return jsonOk(merchant);
  } catch (error) {
    return jsonError(500, "merchant_profile_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    if (!payload.walletAddress) {
      return jsonError(400, "invalid_request", "walletAddress is required.");
    }

    const merchant = await upsertMerchantProfile(payload);
    return jsonOk(merchant, { status: 201 });
  } catch (error) {
    return jsonError(500, "merchant_profile_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
