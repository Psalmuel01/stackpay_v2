import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    storage: {
      engine: "supabase",
      configured: isSupabaseConfigured(),
    },
    contracts: {
      architecture: process.env.NEXT_PUBLIC_STACKPAY_ARCHITECTURE_CONTRACT_ID ?? null,
    },
  });
}
