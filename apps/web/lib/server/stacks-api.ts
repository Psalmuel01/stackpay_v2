import { stacksNetworks } from "@stackpay/config";

function getStacksApiUrl() {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "testnet";
  return process.env.STACKPAY_STACKS_API_URL ?? stacksNetworks[network]?.apiUrl ?? stacksNetworks.testnet.apiUrl;
}

export type TxSyncResult =
  | {
      status: "pending";
    }
  | {
      status: "success";
      resultRepr: string | null;
      onchainId: string | null;
      confirmedAt: number | null;
    }
  | {
      status: "abort_by_response" | "abort_by_post_condition" | "failed";
      resultRepr: string | null;
      reason: string | null;
      confirmedAt: number | null;
    };

function parseOkAsciiResult(repr: string | null) {
  if (!repr) {
    return null;
  }

  const match = /^\(ok\s+"([^"]+)"\)$/.exec(repr.trim());
  return match?.[1] ?? null;
}

export async function syncInvoiceCreationTx(txId: string): Promise<TxSyncResult> {
  const response = await fetch(`${getStacksApiUrl()}/extended/v1/tx/${txId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction ${txId} from Stacks API.`);
  }

  const payload = await response.json();
  const status = payload.tx_status as string | undefined;
  const resultRepr = payload.tx_result?.repr ?? null;
  const confirmedAt = typeof payload.burn_block_time === "number" ? payload.burn_block_time : null;

  if (!status || status === "pending") {
    return { status: "pending" };
  }

  if (status === "success") {
    return {
      status: "success",
      resultRepr,
      onchainId: parseOkAsciiResult(resultRepr),
      confirmedAt,
    };
  }

  if (status === "abort_by_response" || status === "abort_by_post_condition") {
    return {
      status,
      resultRepr,
      reason: payload.tx_result?.repr ?? null,
      confirmedAt,
    };
  }

  return {
    status: "failed",
    resultRepr,
    reason: payload.tx_status ?? null,
    confirmedAt,
  };
}
