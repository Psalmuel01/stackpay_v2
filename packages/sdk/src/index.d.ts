export declare class StackPay {
  constructor(options?: { apiKey?: string; baseUrl?: string });
  request(path: string, init?: RequestInit): Promise<unknown>;
  invoices: {
    list: () => Promise<unknown>;
    create: (payload: Record<string, unknown>) => Promise<unknown>;
  };
  subscriptions: {
    list: () => Promise<unknown>;
    create: (payload: Record<string, unknown>) => Promise<unknown>;
  };
  settlements: {
    list: () => Promise<unknown>;
  };
  webhooks: {
    test: (payload: Record<string, unknown>) => Promise<unknown>;
  };
}
