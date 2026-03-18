export type SupportedCurrency = {
  symbol: string;
  name: string;
  description: string;
  tone: string;
  settlementAsset: boolean;
};

export type InvoiceType = {
  id: string;
  label: string;
  description: string;
};

export type MvpTrack = {
  id: string;
  title: string;
  outcome: string;
};

export type ContractBacklogItem = {
  id: string;
  title: string;
  reason: string;
};

export declare const stackpayPositioning: string;
export declare const supportedCurrencies: SupportedCurrency[];
export declare const invoiceTypes: InvoiceType[];
export declare const invoiceStatuses: string[];
export declare const subscriptionCollectionModes: InvoiceType[];
export declare const mvpTracks: MvpTrack[];
export declare const contractBacklog: ContractBacklogItem[];
