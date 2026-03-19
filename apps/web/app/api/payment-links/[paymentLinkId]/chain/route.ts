import { jsonError, jsonOk } from "@/lib/server/http";
import { confirmPaymentLinkChain } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";
import { syncInvoiceCreationTx } from "@/lib/server/stacks-api";

export async function POST(
  request: Request,
  context: { params: { paymentLinkId: string } }
) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    let onchainLinkId = payload.onchainLinkId ?? null;

    if (!onchainLinkId && payload.txId) {
      const sync = await syncInvoiceCreationTx(payload.txId);
      if (sync.status === "success" && sync.onchainId) {
        onchainLinkId = sync.onchainId;
      } else if (sync.status !== "pending") {
        return jsonError(400, "payment_link_chain_failed", sync.resultRepr ?? "Payment link transaction failed.");
      }
    }

    const paymentLink = await confirmPaymentLinkChain({
      id: context.params.paymentLinkId,
      txId: payload.txId,
      onchainId: onchainLinkId,
    });
    return jsonOk(paymentLink);
  } catch (error) {
    return jsonError(500, "payment_link_chain_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
