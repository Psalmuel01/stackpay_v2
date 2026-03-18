import { tx } from "@stacks/clarinet-sdk";
import { Cl, cvToValue, noneCV, stringAsciiCV, stringUtf8CV, uintCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const merchant = accounts.get("wallet_1")!;
const recipient = accounts.get("wallet_2")!;

describe("architecture", () => {
  it("registers merchants and stores indexed invoices", () => {
    const block = simnet.mineBlock([
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "create-invoice",
        [
          Cl.principal(recipient),
          uintCV(1200),
          stringAsciiCV("STX"),
          uintCV(20),
          stringUtf8CV("Starter plan"),
          stringUtf8CV("tier=starter"),
          stringUtf8CV("owner@merchant.test"),
          noneCV(),
        ],
        merchant
      ),
    ]);

    expect(block[0].result).toBeOk(Cl.principal(merchant));

    const invoiceId = cvToValue(block[1].result.value) as string;
    expect(block[1].result).toBeOk(Cl.stringAscii(invoiceId));

    const count = simnet.callReadOnlyFn("architecture", "get-invoice-count", [], merchant);
    expect(count.result).toBeOk(Cl.uint(1));

    const payable = simnet.callReadOnlyFn(
      "architecture",
      "is-invoice-payable",
      [stringAsciiCV(invoiceId)],
      merchant
    );
    expect(payable.result).toBeBool(true);

    const invoice = simnet.callReadOnlyFn(
      "architecture",
      "get-invoice",
      [stringAsciiCV(invoiceId)],
      merchant
    );
    expect(invoice.result).toBeSome(
      Cl.tuple({
        merchant: Cl.principal(merchant),
        recipient: Cl.principal(recipient),
        amount: Cl.uint(1200),
        currency: Cl.stringAscii("STX"),
        status: Cl.uint(0),
        "created-at": Cl.uint(2),
        "expires-at": Cl.uint(22),
        "paid-at": Cl.none(),
        description: Cl.stringUtf8("Starter plan"),
        metadata: Cl.stringUtf8("tier=starter"),
        email: Cl.stringUtf8("owner@merchant.test"),
        "payment-address": Cl.none(),
        "webhook-url": Cl.none(),
      })
    );
  });

  it("expires invoices after they pass their block deadline", () => {
    const block = simnet.mineBlock([
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "create-invoice",
        [
          Cl.principal(recipient),
          uintCV(400),
          stringAsciiCV("USDCx"),
          uintCV(1),
          stringUtf8CV("Flash sale"),
          stringUtf8CV("campaign=flash"),
          stringUtf8CV("ops@merchant.test"),
          noneCV(),
        ],
        merchant
      ),
    ]);

    const invoiceId = cvToValue(block[1].result.value) as string;
    simnet.mineEmptyBlocks(1);

    const expire = simnet.callPublicFn(
      "architecture",
      "expire-invoice",
      [stringAsciiCV(invoiceId)],
      merchant
    );

    expect(expire.result).toBeOk(Cl.bool(true));

    const invoice = simnet.callReadOnlyFn(
      "architecture",
      "get-invoice",
      [stringAsciiCV(invoiceId)],
      merchant
    );
    expect(invoice.result).toBeSome(
      Cl.tuple({
        merchant: Cl.principal(merchant),
        recipient: Cl.principal(recipient),
        amount: Cl.uint(400),
        currency: Cl.stringAscii("USDCx"),
        status: Cl.uint(2),
        "created-at": Cl.uint(1),
        "expires-at": Cl.uint(2),
        "paid-at": Cl.none(),
        description: Cl.stringUtf8("Flash sale"),
        metadata: Cl.stringUtf8("campaign=flash"),
        email: Cl.stringUtf8("ops@merchant.test"),
        "payment-address": Cl.none(),
        "webhook-url": Cl.none(),
      })
    );
  });
});
