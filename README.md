# StackPay

StackPay is a Bitcoin-native payment gateway on Stacks for sBTC, STX, and USDCx. It provides on-chain invoices, subscriptions, automated settlements, and developer tooling (REST API, webhooks, SDKs) so businesses can accept Bitcoin-based payments without building infrastructure from scratch.

## Monorepo Structure
- `apps/web`: Next.js 14 App Router marketing site, console, and hosted payment surfaces
- `apps/api`: Node API scaffold for REST resources, webhook delivery, and merchant orchestration
- `packages/domain`: Shared business models, product flows, and MVP metadata
- `packages/integrations`: REST resources, webhook event catalog, and integration manifests
- `packages/sdk`: JavaScript client for StackPay APIs
- `packages/ui`: Shared navigation and UI metadata
- `packages/config`: Shared environment and network configuration
- `packages/contracts/stackpay`: Clarity contracts and tests

## UI Structure
- Site pages live under `apps/web/app/(site)`
- App console lives under `apps/web/app/(app)` and includes its own header + mobile nav
- Hosted payment and public receipt routes still need to be implemented

## Getting Started
1. Install dependencies
2. Run the web app

```bash
npm install
npm run dev
```

Run the API scaffold:

```bash
npm run dev:api
```

Run contract tests:

```bash
npm run test:contracts
```

## Environment
See `apps/web/.env.example` for Stacks Connect metadata and network settings.

API defaults:
- `STACKPAY_API_PORT=4000`
- `STACKPAY_API_BASE_URL=http://localhost:4000`

## Notes
- Fonts: local-first sans + mono stacks to avoid build-time network fetches
- Particle sphere: Three.js (white/gray particles, 30s rotation, hidden on mobile)
- Style language: glassmorphism on matte black, low-contrast borders, pill navigation, orange accent

## Product Blueprint
The repo now includes an MVP and contract-gap blueprint at `/Users/sam/Desktop/Stacks/Stackpay/docs/stackpay-mvp-blueprint.md`.
