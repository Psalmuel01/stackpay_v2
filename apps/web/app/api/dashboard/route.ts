import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getDashboardData } from "@/lib/server/stackpay-service";
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
    const dashboard = await getDashboardData(walletAddress);
    return jsonOk(dashboard);
  } catch (error) {
    return jsonError(500, "dashboard_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}

