"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { showConnect } from "@stacks/connect";
import { getConnectedWalletAddress, userSession } from "@/lib/stacks";
import { useDemo } from "@/components/app/DemoProvider";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectWalletButton() {
  const { state } = useDemo();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  useEffect(() => {
    setConnected(userSession.isUserSignedIn());
    setAddress(getConnectedWalletAddress());
  }, []);

  const appDetails = useMemo(
    () => ({
      name: process.env.NEXT_PUBLIC_APP_NAME ?? "StackPay",
      icon: process.env.NEXT_PUBLIC_APP_ICON ?? "",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    }),
    []
  );

  useEffect(() => {
    setAddress(getConnectedWalletAddress());
  }, [connected]);

  const handleConnect = () => {
    showConnect({
      appDetails,
      userSession,
      onFinish: () => {
        setConnected(true);
        setAddress(getConnectedWalletAddress());
      },
    });
  };

  const handleDisconnect = () => {
    userSession.signUserOut();
    setConnected(false);
    setAddress(null);
    setOpen(false);
  };

  async function handleCopy() {
    if (!address) {
      return;
    }
    await navigator.clipboard.writeText(address);
    setOpen(false);
  }

  if (!connected || !address) {
    return (
      <button
        onClick={handleConnect}
        className="button-glow rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
        <span>{truncateAddress(address)}</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] w-72 rounded-3xl border border-white/10 bg-[#0a0a0a]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="rounded-2xl bg-white/5 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Connected wallet</div>
            <div className="mt-2 font-mono text-xs text-white/75">{address.slice(0, 6)}...{address.slice(-4)}</div>
          </div>
          <div className="mt-3 rounded-2xl bg-white/5 px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Demo balances</div>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              <div className="flex items-center justify-between">
                <span>sBTC</span>
                <span>{state.balances.sBTC}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>STX</span>
                <span>{state.balances.STX}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>USDCx</span>
                <span>{state.balances.USDCx}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Copy
            </button>
            <button
              onClick={handleDisconnect}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
