import { jsonError, jsonOk } from "@/lib/server/http";
import { confirmInvoiceCreation } from "@/lib/server/stackpay-service";
import { isSupabaseConfigured } from "@/lib/server/supabase-admin";
import { syncInvoiceCreationTx } from "@/lib/server/stacks-api";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError(503, "supabase_not_configured", "Supabase environment variables are missing.");
  }

  try {
    const payload = await request.json();
    if (!payload.txId) {
      return jsonError(400, "invalid_request", "txId is required.");
    }

    const sync = await syncInvoiceCreationTx(payload.txId);

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

    const invoice = await confirmInvoiceCreation({
      walletAddress: payload.walletAddress,
      txId: payload.txId,
      onchainId: sync.onchainId,
      amount: payload.amount,
      currency: payload.currency,
      description: payload.description,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      recipientAddress: payload.recipientAddress,
      expiresInSeconds: payload.expiresInSeconds,
      confirmedAt: sync.confirmedAt,
    });

    return jsonOk({
      invoice,
      sync: {
        status: "success",
        onchainInvoiceId: sync.onchainId,
        result: sync.resultRepr,
      },
    });
  } catch (error) {
    return jsonError(500, "invoice_confirm_failed", error instanceof Error ? error.message : "Unexpected error.");
  }
}
