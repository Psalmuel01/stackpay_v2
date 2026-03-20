export const stackpayApiDefaults = {
  baseUrl: process.env.STACKPAY_API_BASE_URL ?? "http://localhost:4000",
  port: Number(process.env.STACKPAY_API_PORT ?? 4000),
  version: "v1",
};

export const stacksNetworks = {
  simnet: {
    label: "Simnet",
    apiUrl: "http://127.0.0.1:3999",
  },
  devnet: {
    label: "Devnet",
    apiUrl: "http://127.0.0.1:3999",
  },
  testnet: {
    label: "Testnet",
    apiUrl: "https://api.testnet.hiro.so",
  },
  mainnet: {
    label: "Mainnet",
    apiUrl: "https://api.hiro.so",
  },
};

export const stackpayEnvKeys = [
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_ICON",
  "NEXT_PUBLIC_STACKS_NETWORK",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_STACKPAY_ARCHITECTURE_CONTRACT_ID",
  "STACKPAY_STACKS_API_URL",
  "STACKPAY_CHAINHOOK_SECRET",
  "STACKPAY_API_PORT",
  "STACKPAY_API_BASE_URL",
];
