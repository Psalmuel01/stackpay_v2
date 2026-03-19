import { jsonError } from "@/lib/server/http";

export async function POST() {
  return jsonError(
    410,
    "deprecated_endpoint",
    "Use POST /api/invoices/confirm. Invoices are only stored after the transaction confirms on-chain."
  );
}
