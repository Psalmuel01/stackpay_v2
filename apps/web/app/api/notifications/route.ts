import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import {
  listNotificationsForWallet,
  markNotificationsReadForWallet,
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
    const notifications = await listNotificationsForWallet(walletAddress);
    return jsonOk(notifications);
  } catch (error) {
    return jsonError(500, "notifications_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    if (!payload.walletAddress) {
      return jsonError(400, "invalid_request", "walletAddress is required.");
    }

    const notifications = await markNotificationsReadForWallet(String(payload.walletAddress));
    return jsonOk(notifications);
  } catch (error) {
    return jsonError(500, "notifications_update_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}

