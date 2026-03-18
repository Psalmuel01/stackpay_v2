import { tx } from "@stacks/clarinet-sdk";
import { Cl, cvToValue, noneCV, stringAsciiCV, stringUtf8CV, uintCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = simnet.deployer;
const merchant = accounts.get("wallet_1")!;
const payer = accounts.get("wallet_2")!;
const recipient = accounts.get("wallet_3")!;
const processorPrincipal = `${deployer}.processor`;

function getCurrentTime(sender: string) {
  const now = simnet.callReadOnlyFn("architecture", "get-current-time", [], sender);
  expect(now.result).toBeOk(Cl.uint(cvToValue(now.result.value) as bigint));
  return cvToValue(now.result.value) as bigint;
}

describe("processor", () => {
  it("processes STX payments and credits merchant balances", () => {
    const setup = simnet.mineBlock([
      tx.callPublicFn("architecture", "set-processor", [Cl.principal(processorPrincipal)], deployer),
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "create-invoice",
        [
          Cl.principal(recipient),
          uintCV(1000),
          stringAsciiCV("STX"),
          uintCV(3600),
          stringUtf8CV("Consulting invoice"),
          stringUtf8CV("engagement=alpha"),
          stringUtf8CV("billing@merchant.test"),
          noneCV(),
        ],
        merchant
      ),
    ]);

    expect(setup[0].result).toBeOk(Cl.bool(true));
    const invoiceId = cvToValue(setup[2].result.value) as string;
    const createdAt = getCurrentTime(merchant);

    const payment = simnet.callPublicFn(
      "processor",
      "process-stx-payment",
      [stringAsciiCV(invoiceId), uintCV(1000), Cl.bufferFromHex("11".repeat(32))],
      payer
    );

    expect(payment.result).toBeOk(Cl.bool(true));
    const paidAt = getCurrentTime(merchant);

    const balance = simnet.callReadOnlyFn(
      "processor",
      "get-balance",
      [Cl.principal(merchant), stringAsciiCV("STX")],
      merchant
    );
    expect(balance.result).toBeSome(Cl.tuple({ amount: Cl.uint(1000) }));

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
        amount: Cl.uint(1000),
        currency: Cl.stringAscii("STX"),
        status: Cl.uint(1),
        "created-at": Cl.uint(createdAt),
        "expires-at": Cl.uint(createdAt + 3600n),
        "paid-at": Cl.some(Cl.uint(paidAt)),
        description: Cl.stringUtf8("Consulting invoice"),
        metadata: Cl.stringUtf8("engagement=alpha"),
        email: Cl.stringUtf8("billing@merchant.test"),
        "payment-address": Cl.none(),
        "webhook-url": Cl.none(),
      })
    );
  });

  it("withdraws STX and applies the platform fee", () => {
    const setup = simnet.mineBlock([
      tx.callPublicFn("architecture", "set-processor", [Cl.principal(processorPrincipal)], deployer),
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "create-invoice",
        [
          Cl.principal(recipient),
          uintCV(1000),
          stringAsciiCV("STX"),
          uintCV(3600),
          stringUtf8CV("Withdrawal invoice"),
          stringUtf8CV("settlement=batch"),
          stringUtf8CV("billing@merchant.test"),
          noneCV(),
        ],
        merchant
      ),
    ]);

    const invoiceId = cvToValue(setup[2].result.value) as string;

    simnet.mineBlock([
      tx.callPublicFn(
        "processor",
        "process-stx-payment",
        [stringAsciiCV(invoiceId), uintCV(1000), Cl.bufferFromHex("22".repeat(32))],
        payer
      ),
    ]);

    const withdraw = simnet.callPublicFn(
      "processor",
      "withdraw",
      [stringAsciiCV("STX"), uintCV(1000), Cl.contractPrincipal(deployer, "processor")],
      merchant
    );

    expect(withdraw.result).toBeOk(
      Cl.tuple({
        withdrawn: Cl.uint(990),
        fee: Cl.uint(10),
      })
    );

    const balance = simnet.callReadOnlyFn(
      "processor",
      "get-balance",
      [Cl.principal(merchant), stringAsciiCV("STX")],
      merchant
    );
    expect(balance.result).toBeSome(Cl.tuple({ amount: Cl.uint(0) }));
  });
});
