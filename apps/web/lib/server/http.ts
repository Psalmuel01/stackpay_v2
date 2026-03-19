import { NextResponse } from "next/server";

export function logTransactionResponse(label: string, payload: unknown) {
  console.log(`[stackpay:tx] ${label}`, JSON.stringify(payload, null, 2));
}

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}
