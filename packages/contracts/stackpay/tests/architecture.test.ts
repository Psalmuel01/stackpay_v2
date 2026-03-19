import { tx } from "@stacks/clarinet-sdk";
import { Cl, cvToValue, stringAsciiCV, stringUtf8CV, uintCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const merchant = accounts.get("wallet_1")!;
const recipient = accounts.get("wallet_2")!;

function getCurrentTime(sender: string) {
  const now = simnet.callReadOnlyFn("architecture", "get-current-time", [], sender);
  expect(now.result).toBeOk(Cl.uint(cvToValue(now.result.value) as bigint));
  return cvToValue(now.result.value) as bigint;
}

describe("architecture", () => {
  it("creates on-chain invoices without requiring merchant registration", () => {
    const created = simnet.callPublicFn(
      "architecture",
      "create-invoice",
      [
        Cl.principal(recipient),
        uintCV(1200),
        stringAsciiCV("STX"),
        uintCV(3600),
        stringUtf8CV("Starter plan"),
      ],
      merchant
    );

    const invoiceId = cvToValue(created.result.value) as string;
    expect(created.result).toBeOk(Cl.stringAscii(invoiceId));

    const createdAt = getCurrentTime(merchant);
    const invoice = simnet.callReadOnlyFn(
      "architecture",
      "get-invoice",
      [stringAsciiCV(invoiceId)],
      merchant
    );

    expect(invoice.result).toBeOk(
      Cl.some(
        Cl.tuple({
          merchant: Cl.principal(merchant),
          recipient: Cl.principal(recipient),
          amount: Cl.uint(1200),
          currency: Cl.stringAscii("STX"),
          status: Cl.uint(0),
          "created-at": Cl.uint(createdAt),
          "expires-at": Cl.uint(createdAt + 3600n),
          "paid-at": Cl.none(),
          description: Cl.stringUtf8("Starter plan"),
        })
      )
    );

    const payable = simnet.callReadOnlyFn(
      "architecture",
      "is-invoice-payable",
      [stringAsciiCV(invoiceId)],
      merchant
    );
    expect(payable.result).toBeBool(true);
  });

  it("expires invoices after their time deadline passes", () => {
    const invalid = simnet.callPublicFn(
      "architecture",
      "create-invoice",
      [
        Cl.principal(recipient),
        uintCV(400),
        stringAsciiCV("USDCx"),
        uintCV(0),
        stringUtf8CV("Too soon"),
      ],
      merchant
    );
    expect(invalid.result).toBeErr(Cl.uint(107));

    const created = simnet.callPublicFn(
      "architecture",
      "create-invoice",
      [
        Cl.principal(recipient),
        uintCV(400),
        stringAsciiCV("USDCx"),
        uintCV(1),
        stringUtf8CV("Flash sale"),
      ],
      merchant
    );

    const invoiceId = cvToValue(created.result.value) as string;
    const createdAt = getCurrentTime(merchant);

    simnet.mineEmptyBlocks(1);

    const expired = simnet.callPublicFn(
      "architecture",
      "expire-invoice",
      [stringAsciiCV(invoiceId)],
      merchant
    );
    expect(expired.result).toBeOk(Cl.bool(true));

    const invoice = simnet.callReadOnlyFn(
      "architecture",
      "get-invoice",
      [stringAsciiCV(invoiceId)],
      merchant
    );

    expect(invoice.result).toBeOk(
      Cl.some(
        Cl.tuple({
          merchant: Cl.principal(merchant),
          recipient: Cl.principal(recipient),
          amount: Cl.uint(400),
          currency: Cl.stringAscii("USDCx"),
          status: Cl.uint(2),
          "created-at": Cl.uint(createdAt),
          "expires-at": Cl.uint(createdAt + 1n),
          "paid-at": Cl.none(),
          description: Cl.stringUtf8("Flash sale"),
        })
      )
    );
  });
});
