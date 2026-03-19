import { jsonError, jsonOk } from "@/lib/server/http";
import { confirmInvoiceChain } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";

export async function POST(
  request: Request,
  context: { params: { invoiceId: string } }
) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    const invoice = await confirmInvoiceChain({
      id: context.params.invoiceId,
      txId: payload.txId,
      onchainId: payload.onchainInvoiceId,
    });
    return jsonOk(invoice);
  } catch (error) {
    return jsonError(500, "invoice_chain_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
