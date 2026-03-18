export type IntegrationLayer = {
  id: string;
  label: string;
  description: string;
};

export type ApiResource = {
  method: string;
  path: string;
  purpose: string;
};

export declare const integrationLayers: IntegrationLayer[];
export declare const apiResources: ApiResource[];
export declare const webhookEvents: string[];
