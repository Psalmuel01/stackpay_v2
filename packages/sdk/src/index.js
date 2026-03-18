export class StackPay {
  constructor({
    apiKey,
    baseUrl = process.env.STACKPAY_API_BASE_URL ?? "http://localhost:4000",
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(path, init = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`StackPay request failed with ${response.status}`);
    }

    return response.json();
  }

  invoices = {
    list: () => this.request("/v1/invoices"),
    create: (payload) =>
      this.request("/v1/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  subscriptions = {
    list: () => this.request("/v1/subscriptions"),
    create: (payload) =>
      this.request("/v1/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  settlements = {
    list: () => this.request("/v1/settlements"),
  };

  webhooks = {
    test: (payload) =>
      this.request("/v1/webhooks/test", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
}
