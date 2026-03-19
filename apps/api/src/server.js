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
import { isDatabaseConfigured } from "./db/client.js";
import { readJsonBody, sendError, sendJson, sendMethodNotAllowed, sendNotFound } from "./lib/http.js";
import { ensureDemoMerchant } from "./store/postgres.js";
import * as store from "./store/postgres.js";

function jsonArrayParam(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return undefined;
}

function invoiceExpiry(payload) {
  if (!payload.expirationHours) {
    return null;
  }
  return new Date(Date.now() + Number(payload.expirationHours) * 60 * 60 * 1000).toISOString();
}

function splitPath(pathname) {
  return pathname.split("/").filter(Boolean);
}

async function withDatabaseRoute(response, handler) {
  if (!isDatabaseConfigured()) {
    sendError(
      response,
      503,
      "database_not_configured",
      "DATABASE_URL must be configured before using StackPay API resources."
    );
    return;
  }

  await handler();
}

export function createStackPayServer() {
  return createServer(async (request, response) => {
    try {
      if (!request.url) {
        sendError(response, 400, "invalid_request", "Request URL is missing.");
        return;
      }

      const url = new URL(request.url, stackpayApiDefaults.baseUrl);
      const { method = "GET" } = request;
      const segments = splitPath(url.pathname);

      if (method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, {
          status: "ok",
          product: stackpayPositioning,
          storage: {
            engine: "postgres",
            configured: isDatabaseConfigured(),
          },
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

      await withDatabaseRoute(response, async () => {
        if (method === "GET" && url.pathname === "/v1/merchants") {
          sendJson(response, 200, { data: await store.listMerchants() });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/merchants") {
          const payload = await readJsonBody(request);
          sendJson(response, 201, { data: await store.createMerchant(payload) });
          return;
        }

        if (segments[0] === "v1" && segments[1] === "merchants" && segments[2]) {
          if (method === "GET" && segments.length === 3) {
            const merchant = await store.getMerchant(segments[2]);
            if (!merchant) {
              sendNotFound(response, url.pathname);
              return;
            }
            sendJson(response, 200, { data: merchant });
            return;
          }

          if ((method === "PATCH" || method === "PUT") && segments.length === 3) {
            const payload = await readJsonBody(request);
            const merchant = await store.updateMerchant(segments[2], payload);
            if (!merchant) {
              sendNotFound(response, url.pathname);
              return;
            }
            sendJson(response, 200, { data: merchant });
            return;
          }
        }

        if (method === "GET" && url.pathname === "/v1/invoices") {
          sendJson(response, 200, {
            data: await store.listInvoices({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
              status: url.searchParams.get("status") ?? undefined,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/invoices") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          const invoiceId = payload.id;
          const data = await store.createInvoice({
            ...payload,
            id: invoiceId ?? undefined,
            merchantId: merchant.id,
            hostedPath: payload.hostedPath,
            expiresAt: payload.expiresAt ?? invoiceExpiry(payload),
          });
          sendJson(response, 201, { data });
          return;
        }

        if (segments[0] === "v1" && segments[1] === "invoices" && segments[2] && method === "GET") {
          const invoice = await store.getInvoice(segments[2]);
          if (!invoice) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 200, { data: invoice });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/payment-links") {
          sendJson(response, 200, {
            data: await store.listPaymentLinks({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
              mode: url.searchParams.get("mode") ?? undefined,
            }),
          });
          return;
        }

        if (
          method === "GET" &&
          segments[0] === "v1" &&
          segments[1] === "payment-links" &&
          segments[2] === "by-slug" &&
          segments[3]
        ) {
          const link = await store.getPaymentLinkBySlug(segments[3]);
          if (!link) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 200, { data: link });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/payment-links") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          const data = await store.createPaymentLink({
            ...payload,
            merchantId: merchant.id,
            acceptedCurrencies: jsonArrayParam(payload.acceptedCurrencies),
          });
          sendJson(response, 201, { data });
          return;
        }

        if (segments[0] === "v1" && segments[1] === "payment-links" && segments[2] && segments.length === 3) {
          if (method !== "GET") {
            sendMethodNotAllowed(response, method, url.pathname);
            return;
          }
          const link = await store.getPaymentLink(segments[2]);
          if (!link) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 200, { data: link });
          return;
        }

        if (
          segments[0] === "v1" &&
          segments[1] === "payment-links" &&
          segments[2] &&
          segments[3] === "deactivate"
        ) {
          if (method !== "POST") {
            sendMethodNotAllowed(response, method, url.pathname);
            return;
          }
          const link = await store.deactivatePaymentLink(segments[2]);
          if (!link) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 200, { data: link });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/qr-links/universal") {
          const merchant = url.searchParams.get("merchantId")
            ? await store.getMerchant(url.searchParams.get("merchantId"))
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 200, { data: await store.getUniversalQrLink(merchant.id) });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/qr-links/universal") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          const data = await store.createOrReplaceUniversalQrLink({
            merchantId: merchant.id,
            slugBase: merchant.slug,
            title: payload.title ?? `${merchant.businessName} universal QR`,
            description:
              payload.description ?? "Permanent universal QR route for daily payments.",
          });
          sendJson(response, 201, { data });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/subscription-plans") {
          sendJson(response, 200, {
            data: await store.listSubscriptionPlans({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
            }),
          });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/receipts") {
          sendJson(response, 200, {
            data: await store.listReceipts({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
              invoiceId: url.searchParams.get("invoiceId") ?? undefined,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/receipts") {
          const payload = await readJsonBody(request);
          const invoice = payload.invoiceId ? await store.getInvoice(payload.invoiceId) : null;
          if (!invoice) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 201, {
            data: await store.createReceipt({
              ...payload,
              merchantId: payload.merchantId ?? invoice.merchantId,
              currency: payload.currency ?? invoice.currency,
              amount: payload.amount ?? invoice.amount,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/subscription-plans") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 201, {
            data: await store.createSubscriptionPlan({
              ...payload,
              merchantId: merchant.id,
            }),
          });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/subscriptions") {
          sendJson(response, 200, {
            data: await store.listSubscriptions({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/subscriptions") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 201, {
            data: await store.createSubscription({
              ...payload,
              merchantId: merchant.id,
            }),
          });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/settlement-policies") {
          sendJson(response, 200, {
            data: await store.listSettlementPolicies({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/settlement-policies") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 201, {
            data: await store.createSettlementPolicy({
              ...payload,
              merchantId: merchant.id,
            }),
          });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/settlement-runs") {
          sendJson(response, 200, {
            data: await store.listSettlementRuns({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/settlement-runs") {
          const payload = await readJsonBody(request);
          sendJson(response, 201, {
            data: await store.createSettlementRun(payload),
          });
          return;
        }

        if (method === "GET" && url.pathname === "/v1/webhook-deliveries") {
          sendJson(response, 200, {
            data: await store.listWebhookDeliveries({
              merchantId: url.searchParams.get("merchantId") ?? undefined,
            }),
          });
          return;
        }

        if (method === "POST" && url.pathname === "/v1/webhooks/test") {
          const payload = await readJsonBody(request);
          const merchant = payload.merchantId
            ? await store.getMerchant(payload.merchantId)
            : await ensureDemoMerchant();
          if (!merchant) {
            sendNotFound(response, url.pathname);
            return;
          }
          sendJson(response, 202, {
            data: await store.createWebhookDelivery({
              merchantId: merchant.id,
              event: payload.event ?? "invoice.paid",
              target: payload.target ?? merchant.webhookUrl ?? "https://merchant.example/webhooks/stackpay",
              status: "delivered",
              summary: `${payload.event ?? "invoice.paid"} test event delivered`,
            }),
          });
          return;
        }

        sendNotFound(response, url.pathname);
      });
    } catch (error) {
      console.error(error);
      sendError(
        response,
        500,
        "internal_error",
        error instanceof Error ? error.message : "Unexpected server error."
      );
    }
  });
}
