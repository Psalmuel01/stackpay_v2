"use client";

import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PageHeader from "@/components/app/PageHeader";
import StatusBadge from "@/components/app/StatusBadge";
import {
  type Currency,
  formatCurrencyAmount,
  formatDateTime,
  useDemo,
} from "@/components/app/DemoProvider";

const currencies: Currency[] = ["sBTC", "STX", "USDCx"];

export default function SettlementsPage() {
  const { state, actions } = useDemo();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [currency, setCurrency] = useState<Currency>("sBTC");
  const [trigger, setTrigger] = useState<"threshold" | "scheduled">("threshold");
  const [threshold, setThreshold] = useState("");
  const [cadence, setCadence] = useState("");
  const [minPayout, setMinPayout] = useState("");

  return (
    <div>
      <PageHeader
        title="Settlements"
        subtitle="Configure payout rules, run demo settlement executions, and verify how balances and webhook logs react before wiring real persistence."
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard className="border border-white/20">
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Settlement rules
          </div>
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Policy name"
              />
              <input
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Destination wallet"
              />
              <div className="flex flex-wrap gap-2">
                {currencies.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCurrency(item)}
                    className={`rounded-full px-4 py-2 text-xs ${
                      currency === item
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["threshold", "scheduled"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setTrigger(item)}
                    className={`rounded-full px-4 py-2 text-xs ${
                      trigger === item
                        ? "border border-white/20 bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {trigger === "threshold" ? (
                <input
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  placeholder="Threshold"
                />
              ) : (
                <input
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                  value={cadence}
                  onChange={(event) => setCadence(event.target.value)}
                  placeholder="Cadence hours"
                />
              )}
              <input
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                value={minPayout}
                onChange={(event) => setMinPayout(event.target.value)}
                placeholder="Minimum payout"
              />
            </div>
            <button
              onClick={() =>
                actions.createSettlementPolicy({
                  name,
                  destination,
                  currency,
                  trigger,
                  threshold: trigger === "threshold" ? Number(threshold || 0) : undefined,
                  cadenceHours: trigger === "scheduled" ? Number(cadence || 0) : undefined,
                  minPayout: Number(minPayout || 0),
                })
              }
              className="mt-4 rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black"
            >
              Create policy
            </button>
          </div>

          <div className="space-y-3">
            {state.settlementPolicies.map((policy) => (
              <div key={policy.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{policy.name}</div>
                    <div className="mt-1 text-sm text-white/55">
                      {policy.trigger === "threshold"
                        ? `Auto-settle when balance exceeds ${policy.threshold} ${policy.currency}`
                        : `Recurring sweep every ${policy.cadenceHours}h`}
                    </div>
                    <div className="mt-1 text-xs text-white/35">
                      Min payout {formatCurrencyAmount(policy.minPayout, policy.currency)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge label={policy.active ? "Active" : "Draft"} />
                    <button
                      onClick={() => actions.toggleSettlementPolicy(policy.id)}
                      className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/70"
                    >
                      {policy.active ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-6 text-[11px] uppercase tracking-[0.26em] text-white/40">
            Upcoming execution
          </div>
          <div className="space-y-3">
            {state.settlementPolicies.map((policy) => (
              <div key={policy.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">{policy.name}</div>
                    <div className="mt-1 text-sm text-white/55">
                      {policy.nextSettlementAt
                        ? `Next run ${formatDateTime(policy.nextSettlementAt)}`
                        : `Threshold ${policy.threshold} ${policy.currency}`}
                    </div>
                  </div>
                  <button
                    onClick={() => actions.executeSettlement(policy.id)}
                    className="rounded-full border border-white/25 bg-white px-4 py-2 text-xs font-semibold text-black"
                  >
                    Run now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-8">
        <div className="mb-4 text-[11px] uppercase tracking-[0.26em] text-white/40">
          Settlement history
        </div>
        <div className="space-y-3 text-sm text-white/70">
          {state.settlementRuns.map((run) => (
            <div
              key={run.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
            >
              {run.txId} {"->"} {run.destination.slice(0, 16)}... {"->"}{" "}
              {formatCurrencyAmount(run.amount, run.currency)} {"->"} {run.status}{" "}
              {formatDateTime(run.executedAt)}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
