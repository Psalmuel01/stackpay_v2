import { jsonError, jsonOk } from "@/lib/server/http";
import { confirmPaymentLinkChain } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";

export async function POST(
  request: Request,
  context: { params: { paymentLinkId: string } }
) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    const paymentLink = await confirmPaymentLinkChain({
      id: context.params.paymentLinkId,
      txId: payload.txId,
      onchainId: payload.onchainLinkId,
    });
    return jsonOk(paymentLink);
  } catch (error) {
    return jsonError(500, "payment_link_chain_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
