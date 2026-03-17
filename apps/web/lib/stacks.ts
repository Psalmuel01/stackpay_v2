import { AppConfig, UserSession } from "@stacks/auth";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

const appConfig = new AppConfig(["store_write", "publish_data"]);

export const userSession = new UserSession({ appConfig });

export const stacksNetwork =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
    ? new StacksMainnet()
    : new StacksTestnet();
