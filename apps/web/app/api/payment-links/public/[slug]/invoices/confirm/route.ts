import { jsonError, jsonOk, logTransactionResponse } from "@/lib/server/http";
import { confirmPublicInvoiceCreation } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";
import { syncInvoiceCreationTx } from "@/lib/server/stacks-api";

export async function POST(
  request: Request,
  context: { params: { slug: string } }
) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    if (!payload.txId) {
      return jsonError(400, "invalid_request", "txId is required.");
    }

    const sync = await syncInvoiceCreationTx(payload.txId);
    logTransactionResponse("payment-link.invoice.confirm.sync", {
      slug: context.params.slug,
      txId: payload.txId,
      sync,
    });

    if (sync.status === "pending") {
      return jsonOk({
        invoice: null,
        sync: {
          status: "pending",
          onchainInvoiceId: null,
        },
      });
    }

    if (sync.status !== "success" || !sync.onchainId) {
      return jsonOk({
        invoice: null,
        sync: {
          status: sync.status,
          onchainInvoiceId: null,
          result: sync.resultRepr,
        },
      });
    }

    const invoice = await confirmPublicInvoiceCreation({
      slug: context.params.slug,
      txId: payload.txId,
      onchainId: sync.onchainId,
      amount: payload.amount,
      currency: payload.currency,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      expiresInSeconds: payload.expiresInSeconds,
      confirmedAt: sync.confirmedAt,
    });

    const responsePayload = {
      invoice,
      sync: {
        status: "success",
        onchainInvoiceId: sync.onchainId,
        result: sync.resultRepr,
      },
    };
    logTransactionResponse("payment-link.invoice.confirm.response", responsePayload);
    return jsonOk(responsePayload);
  } catch (error) {
    return jsonError(500, "public_invoice_confirm_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
