"use client";

import { showConnect } from "@stacks/connect";
import { userSession, stacksNetwork } from "@/lib/stacks";
import { useMemo, useState } from "react";

export default function ConnectWalletButton() {
  const [connected, setConnected] = useState(userSession.isUserSignedIn());

  const appDetails = useMemo(
    () => ({
      name: process.env.NEXT_PUBLIC_APP_NAME ?? "StackPay",
      icon: process.env.NEXT_PUBLIC_APP_ICON ?? "",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    }),
    []
  );

  const handleConnect = () => {
    showConnect({
      appDetails,
      userSession,
      network: stacksNetwork,
      onFinish: () => {
        setConnected(true);
      }
    });
  };

  const handleDisconnect = () => {
    userSession.signUserOut();
    setConnected(false);
  };

  if (connected) {
    return (
      <button
        onClick={handleDisconnect}
        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
      >
        Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="button-glow rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
    >
      Connect Wallet
    </button>
  );
}
