# StackPay

StackPay is a Bitcoin-native payment gateway on Stacks for sBTC, STX, and USDCx. It provides on-chain invoices, subscriptions, automated settlements, and developer tooling (REST API, webhooks, SDKs) so businesses can accept Bitcoin-based payments without building infrastructure from scratch.

## Monorepo Structure
- `apps/web`: Next.js 14 App Router UI (site + console)
- `apps/api`: API service (placeholder)
- `packages/ui`: Shared UI primitives (placeholder)
- `packages/contracts`: Clarity contracts (placeholder)
- `packages/config`: Shared config (placeholder)

## UI Structure
- Site pages live under `apps/web/app/(site)`
- App console lives under `apps/web/app/(app)` and includes its own header + mobile nav

## Getting Started
1. Install dependencies
2. Run the web app

```bash
npm install
npm run dev
```

## Environment
See `apps/web/.env.example` for Stacks Connect metadata and network settings.

## Notes
- Fonts: Bricolage Grotesque, JetBrains Mono
- Particle sphere: Three.js (white/gray particles, 30s rotation, hidden on mobile)
- Style language: glassmorphism on matte black, low-contrast borders, pill navigation, orange accent

## Roadmap (UI first)
- Landing page (done)
- Dashboard, Create Invoice, Invoices, Subscriptions, Settlements, Explorer, Developer, Profile, Profile QR (UI scaffolds done)
- Stacks Connect integration
- Real data wiring (API + Stacks contracts)
