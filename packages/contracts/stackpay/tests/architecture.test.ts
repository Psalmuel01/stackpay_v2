import { tx } from "@stacks/clarinet-sdk";
import { Cl, cvToValue, noneCV, stringAsciiCV, stringUtf8CV, uintCV } from "@stacks/transactions";
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
  it("configures merchant profiles and creates hosted payment links", () => {
    const setup = simnet.mineBlock([
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "configure-merchant-profile",
        [
          Cl.some(Cl.stringAscii("studio-noon")),
          Cl.stringUtf8("Studio Noon"),
          Cl.some(Cl.principal(recipient)),
          stringAsciiCV("sBTC"),
        ],
        merchant
      ),
      tx.callPublicFn(
        "architecture",
        "create-invoice",
        [
          Cl.principal(recipient),
          uintCV(1200),
          stringAsciiCV("STX"),
          uintCV(3600),
          stringUtf8CV("Starter plan"),
          stringUtf8CV("tier=starter"),
          stringUtf8CV("owner@merchant.test"),
          noneCV(),
        ],
        merchant
      ),
    ]);

    const invoiceId = cvToValue(setup[2].result.value) as string;
    const profileUpdatedAt = getCurrentTime(merchant);

    const createLink = simnet.callPublicFn(
      "architecture",
      "create-payment-link",
      [
        stringAsciiCV("studio-noon-april"),
        stringAsciiCV("invoice"),
        Cl.some(Cl.stringAscii(invoiceId)),
        noneCV(),
        stringUtf8CV("April invoice checkout"),
      ],
      merchant
    );

    const linkId = cvToValue(createLink.result.value) as string;
    expect(createLink.result).toBeOk(Cl.stringAscii(linkId));
    const linkCreatedAt = getCurrentTime(merchant);

    const profile = simnet.callReadOnlyFn(
      "architecture",
      "get-merchant-profile",
      [Cl.principal(merchant)],
      merchant
    );
    expect(profile.result).toBeSome(
      Cl.tuple({
        slug: Cl.some(Cl.stringAscii("studio-noon")),
        "display-name": Cl.stringUtf8("Studio Noon"),
        "settlement-wallet": Cl.some(Cl.principal(recipient)),
        "default-currency": Cl.stringAscii("sBTC"),
        "updated-at": Cl.uint(profileUpdatedAt),
      })
    );

    const bySlug = simnet.callReadOnlyFn(
      "architecture",
      "get-payment-link-by-slug",
      [stringAsciiCV("studio-noon-april")],
      merchant
    );
    expect(bySlug.result).toBeSome(
      Cl.tuple({
        merchant: Cl.principal(merchant),
        slug: Cl.stringAscii("studio-noon-april"),
        kind: Cl.stringAscii("invoice"),
        "invoice-id": Cl.some(Cl.stringAscii(invoiceId)),
        "plan-id": Cl.none(),
        title: Cl.stringUtf8("April invoice checkout"),
        "is-active": Cl.bool(true),
        "created-at": Cl.uint(linkCreatedAt),
      })
    );
  });

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
          uintCV(3600),
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
    const createdAt = getCurrentTime(merchant);
    const expiresAt = createdAt + 3600n;

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
        "created-at": Cl.uint(createdAt),
        "expires-at": Cl.uint(expiresAt),
        "paid-at": Cl.none(),
        description: Cl.stringUtf8("Starter plan"),
        metadata: Cl.stringUtf8("tier=starter"),
        email: Cl.stringUtf8("owner@merchant.test"),
        "payment-address": Cl.none(),
        "webhook-url": Cl.none(),
      })
    );
  });

  it("expires invoices after they pass their time deadline", () => {
    const block = simnet.mineBlock([
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "create-invoice",
        [
          Cl.principal(recipient),
          uintCV(400),
          stringAsciiCV("USDCx"),
          uintCV(0),
          stringUtf8CV("ignored"),
          stringUtf8CV("ignored"),
          stringUtf8CV("ignored"),
          noneCV(),
        ],
        merchant
      ),
    ]);

    expect(block[1].result).toBeErr(Cl.uint(107));

    const validBlock = simnet.mineBlock([
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

    const invoiceId = cvToValue(validBlock[1].result.value) as string;
    const createdAt = getCurrentTime(merchant);
    const expiresAt = createdAt + 1n;
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
        "created-at": Cl.uint(createdAt),
        "expires-at": Cl.uint(expiresAt),
        "paid-at": Cl.none(),
        description: Cl.stringUtf8("Flash sale"),
        metadata: Cl.stringUtf8("campaign=flash"),
        email: Cl.stringUtf8("ops@merchant.test"),
        "payment-address": Cl.none(),
        "webhook-url": Cl.none(),
      })
    );
  });

  it("creates subscription plans, subscriber records, and settlement policies", () => {
    const setup = simnet.mineBlock([
      tx.callPublicFn("architecture", "register-merchant", [noneCV()], merchant),
      tx.callPublicFn(
        "architecture",
        "create-subscription-plan",
        [
          stringUtf8CV("Pro Annual"),
          uintCV(120),
          stringAsciiCV("USDCx"),
          uintCV(2_592_000),
          stringUtf8CV("seats=team"),
        ],
        merchant
      ),
    ]);

    const planId = cvToValue(setup[1].result.value) as string;
    const planCreatedAt = getCurrentTime(merchant);
    const firstBillingAt = getCurrentTime(merchant) + 86_400n;

    const subscriptionResult = simnet.callPublicFn(
      "architecture",
      "create-subscription",
      [
        stringAsciiCV(planId),
        Cl.principal(recipient),
        Cl.uint(firstBillingAt),
      ],
      merchant
    );
    const subscriptionId = cvToValue(subscriptionResult.result.value) as string;
    expect(subscriptionResult.result).toBeOk(Cl.stringAscii(subscriptionId));

    const subscriptionCreatedAt = getCurrentTime(merchant);

    const policyResult = simnet.callPublicFn(
      "architecture",
      "create-settlement-policy",
      [
        Cl.principal(recipient),
        stringAsciiCV("USDCx"),
        Cl.uint(1),
        noneCV(),
        Cl.some(Cl.uint(3600)),
        Cl.uint(100),
      ],
      merchant
    );
    const policyId = cvToValue(policyResult.result.value) as string;
    expect(policyResult.result).toBeOk(Cl.stringAscii(policyId));

    const policyCreatedAt = getCurrentTime(merchant);

    const plan = simnet.callReadOnlyFn(
      "architecture",
      "get-subscription-plan",
      [stringAsciiCV(planId)],
      merchant
    );
    expect(plan.result).toBeSome(
      Cl.tuple({
        merchant: Cl.principal(merchant),
        name: Cl.stringUtf8("Pro Annual"),
        amount: Cl.uint(120),
        currency: Cl.stringAscii("USDCx"),
        "interval-seconds": Cl.uint(2_592_000),
        status: Cl.uint(1),
        "created-at": Cl.uint(planCreatedAt),
        metadata: Cl.stringUtf8("seats=team"),
      })
    );

    const subscription = simnet.callReadOnlyFn(
      "architecture",
      "get-subscription",
      [stringAsciiCV(subscriptionId)],
      merchant
    );
    expect(subscription.result).toBeSome(
      Cl.tuple({
        "plan-id": Cl.stringAscii(planId),
        merchant: Cl.principal(merchant),
        subscriber: Cl.principal(recipient),
        status: Cl.uint(1),
        "next-billing-at": Cl.uint(firstBillingAt),
        "last-invoice-id": Cl.none(),
        "created-at": Cl.uint(subscriptionCreatedAt),
      })
    );

    const policy = simnet.callReadOnlyFn(
      "architecture",
      "get-settlement-policy",
      [stringAsciiCV(policyId)],
      merchant
    );
    expect(policy.result).toBeSome(
      Cl.tuple({
        merchant: Cl.principal(merchant),
        destination: Cl.principal(recipient),
        currency: Cl.stringAscii("USDCx"),
        "trigger-kind": Cl.uint(1),
        threshold: Cl.none(),
        "cadence-seconds": Cl.some(Cl.uint(3600)),
        "next-settlement-at": Cl.some(Cl.uint(policyCreatedAt + 3600n)),
        "min-payout": Cl.uint(100),
        active: Cl.bool(true),
        "created-at": Cl.uint(policyCreatedAt),
      })
    );
  });
});
