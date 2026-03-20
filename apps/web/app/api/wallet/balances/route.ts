import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getWalletBalances } from "@/lib/server/stacks-api";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return jsonError(400, "invalid_request", "address is required.");
  }

  try {
    const balances = await getWalletBalances(address);
    return jsonOk(balances);
  } catch (error) {
    return jsonError(500, "wallet_balances_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
