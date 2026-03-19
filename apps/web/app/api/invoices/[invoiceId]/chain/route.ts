import { jsonError, jsonOk } from "@/lib/server/http";
import { confirmInvoiceChain } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";
import { syncInvoiceCreationTx } from "@/lib/server/stacks-api";

export async function POST(
  request: Request,
  context: { params: { invoiceId: string } }
) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    if (!payload.txId) {
      return jsonError(400, "invalid_request", "txId is required.");
    }

    if (payload.onchainInvoiceId) {
      const invoice = await confirmInvoiceChain({
        id: context.params.invoiceId,
        txId: payload.txId,
        onchainId: payload.onchainInvoiceId,
      });
      return jsonOk({
        invoice,
        sync: {
          status: "success",
          onchainInvoiceId: payload.onchainInvoiceId,
        },
      });
    }

    const sync = await syncInvoiceCreationTx(payload.txId);

    if (sync.status === "pending") {
      const invoice = await confirmInvoiceChain({
        id: context.params.invoiceId,
        txId: payload.txId,
        status: "pending_chain",
      });
      return jsonOk({
        invoice,
        sync: {
          status: "pending",
          onchainInvoiceId: null,
        },
      });
    }

    if (sync.status === "success" && sync.onchainId) {
      const invoice = await confirmInvoiceChain({
        id: context.params.invoiceId,
        txId: payload.txId,
        onchainId: sync.onchainId,
        status: "pending_chain",
      });
      return jsonOk({
        invoice,
        sync: {
          status: "success",
          onchainInvoiceId: sync.onchainId,
          result: sync.resultRepr,
        },
      });
    }

    const failureReason = "reason" in sync ? sync.reason : null;
    const invoice = await confirmInvoiceChain({
      id: context.params.invoiceId,
      txId: payload.txId,
      status: "failed",
      failureReason,
    });
    return jsonOk({
      invoice,
      sync: {
        status: sync.status,
        onchainInvoiceId: null,
        result: sync.resultRepr,
      },
    });
  } catch (error) {
    return jsonError(500, "invoice_chain_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
