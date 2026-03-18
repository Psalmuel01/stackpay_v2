import { AppConfig, UserSession } from "@stacks/auth";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

const appConfig = new AppConfig(["store_write", "publish_data"]);

export const userSession = new UserSession({ appConfig });

export const stacksNetwork =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
    ? new StacksMainnet()
    : new StacksTestnet();

export function getConnectedWalletAddress() {
  if (!userSession.isUserSignedIn()) {
    return null;
  }

  const data = userSession.loadUserData();
  const networkKey =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet" ? "mainnet" : "testnet";

  return data.profile?.stxAddress?.[networkKey] ?? null;
}
