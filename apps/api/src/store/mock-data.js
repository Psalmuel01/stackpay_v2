const state = {
  invoices: [
    {
      id: "INV_9821",
      type: "standard",
      merchantId: "studio-noon",
      customer: "Studio Noon",
      amount: "0.018",
      currency: "sBTC",
      status: "pending",
      hostedPath: "/pay/INV_9821",
    },
    {
      id: "INV_9815",
      type: "standard",
      merchantId: "mint-labs",
      customer: "Mint Labs",
      amount: "450",
      currency: "USDCx",
      status: "paid",
      hostedPath: "/pay/INV_9815",
    },
  ],
  subscriptions: [
    {
      id: "sub_pro_annual",
      merchantId: "mint-labs",
      planName: "Pro Annual",
      amount: "120",
      currency: "USDCx",
      interval: "monthly",
      collectionMode: "recurring-invoice",
      status: "active",
    },
  ],
  settlements: [
    {
      id: "set_204",
      merchantId: "studio-noon",
      destination: "Main Wallet",
      trigger: "threshold",
      threshold: "2 sBTC",
      status: "pending",
    },
  ],
};

export function listInvoices() {
  return state.invoices;
}

export function createInvoice(payload) {
  const invoice = {
    id: `INV_${1000 + state.invoices.length + 1}`,
    type: payload.type ?? "standard",
    merchantId: payload.merchantId ?? "demo-merchant",
    customer: payload.customer ?? "New customer",
    amount: String(payload.amount ?? "0"),
    currency: payload.currency ?? "sBTC",
    status: "pending",
    hostedPath: `/pay/INV_${1000 + state.invoices.length + 1}`,
  };

  state.invoices.unshift(invoice);
  return invoice;
}

export function listSubscriptions() {
  return state.subscriptions;
}

export function createSubscription(payload) {
  const subscription = {
    id: `sub_${state.subscriptions.length + 1}`,
    merchantId: payload.merchantId ?? "demo-merchant",
    planName: payload.planName ?? "Untitled plan",
    amount: String(payload.amount ?? "0"),
    currency: payload.currency ?? "USDCx",
    interval: payload.interval ?? "monthly",
    collectionMode: payload.collectionMode ?? "recurring-invoice",
    status: "draft",
  };

  state.subscriptions.unshift(subscription);
  return subscription;
}

export function listSettlements() {
  return state.settlements;
}
