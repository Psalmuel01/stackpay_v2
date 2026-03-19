import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import {
  listInvoicesForWallet,
  prepareInvoiceCreation,
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
    const invoices = await listInvoicesForWallet(walletAddress);
    return jsonOk(invoices);
  } catch (error) {
    return jsonError(500, "invoices_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    const result = await prepareInvoiceCreation(payload);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(500, "invoice_create_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
