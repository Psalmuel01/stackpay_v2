import { createServer } from "node:http";
import { stackpayApiDefaults } from "../../../packages/config/src/index.js";
import {
  contractBacklog,
  invoiceTypes,
  mvpTracks,
  stackpayPositioning,
  subscriptionCollectionModes,
  supportedCurrencies,
} from "../../../packages/domain/src/index.js";
import {
  apiResources,
  integrationLayers,
  webhookEvents,
} from "../../../packages/integrations/src/index.js";
import { readJsonBody, sendJson, sendNotFound } from "./lib/http.js";
import {
  createInvoice,
  createSubscription,
  listInvoices,
  listSettlements,
  listSubscriptions,
} from "./store/mock-data.js";

export function createStackPayServer() {
  return createServer(async (request, response) => {
    if (!request.url) {
      sendJson(response, 400, { error: "invalid_request" });
      return;
    }

    const url = new URL(request.url, stackpayApiDefaults.baseUrl);
    const { method = "GET" } = request;

    if (method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, {
        status: "ok",
        product: stackpayPositioning,
      });
      return;
    }

    if (method === "GET" && url.pathname === "/v1/manifest") {
      sendJson(response, 200, {
        api: stackpayApiDefaults,
        integrations: integrationLayers,
        resources: apiResources,
        webhookEvents,
        supportedCurrencies,
        invoiceTypes,
        subscriptionCollectionModes,
        mvpTracks,
        contractBacklog,
      });
      return;
    }

    if (method === "GET" && url.pathname === "/v1/invoices") {
      sendJson(response, 200, { data: listInvoices() });
      return;
    }

    if (method === "POST" && url.pathname === "/v1/invoices") {
      const payload = await readJsonBody(request);
      sendJson(response, 201, { data: createInvoice(payload) });
      return;
    }

    if (method === "GET" && url.pathname === "/v1/subscriptions") {
      sendJson(response, 200, { data: listSubscriptions() });
      return;
    }

    if (method === "POST" && url.pathname === "/v1/subscriptions") {
      const payload = await readJsonBody(request);
      sendJson(response, 201, { data: createSubscription(payload) });
      return;
    }

    if (method === "GET" && url.pathname === "/v1/settlements") {
      sendJson(response, 200, { data: listSettlements() });
      return;
    }

    if (method === "POST" && url.pathname === "/v1/webhooks/test") {
      const payload = await readJsonBody(request);
      sendJson(response, 202, {
        delivered: true,
        event: payload.event ?? "invoice.paid",
        target: payload.target ?? "https://merchant.example/webhooks/stackpay",
      });
      return;
    }

    sendNotFound(response, url.pathname);
  });
}
