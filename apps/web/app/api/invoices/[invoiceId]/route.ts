import { jsonError, jsonOk } from "@/lib/server/http";
import { getInvoiceByIdOrOnchainId } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";

export async function GET(
  _request: Request,
  context: { params: { invoiceId: string } }
) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const invoice = await getInvoiceByIdOrOnchainId(context.params.invoiceId);
    if (!invoice) {
      return jsonError(404, "not_found", "Invoice not found.");
    }

    return jsonOk(invoice);
  } catch (error) {
    return jsonError(500, "invoice_lookup_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
