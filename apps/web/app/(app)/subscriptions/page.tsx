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

const intervals = [
  { label: "Weekly", seconds: 60 * 60 * 24 * 7 },
  { label: "Monthly", seconds: 60 * 60 * 24 * 30 },
  { label: "Quarterly", seconds: 60 * 60 * 24 * 90 },
];

const currencies: Currency[] = ["USDCx", "sBTC", "STX"];

export default function SubscriptionsPage() {
  const { state, actions } = useDemo();
  const [planName, setPlanName] = useState("");
  const [planAmount, setPlanAmount] = useState("120");
  const [planCurrency, setPlanCurrency] = useState<Currency>("USDCx");
  const [interval, setInterval] = useState(intervals[1]);
  const [subscriberName, setSubscriberName] = useState("Mint Labs");
  const [subscriberEmail, setSubscriberEmail] = useState("billing@mintlabs.io");
  const [selectedPlanId, setSelectedPlanId] = useState(state.plans[0]?.id ?? "");

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Create recurring plans, add subscriber records, and generate renewal invoices so the recurring flow is demo-complete before backend automation."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm uppercase tracking-[0.3em] text-white/40">Plans</div>
            <button
              onClick={() => {
                const plan = actions.createPlan({
                  name: planName || "New plan",
                  amount: Number(planAmount || 0),
                  currency: planCurrency,
                  intervalLabel: interval.label,
                  intervalSeconds: interval.seconds,
                  metadata: `source=console`,
                });
                setSelectedPlanId(plan.id);
                setPlanName("");
              }}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70"
            >
              New plan
            </button>
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
              placeholder="Plan name"
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
              placeholder="Amount"
              value={planAmount}
              onChange={(event) => setPlanAmount(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => setPlanCurrency(currency)}
                  className={`rounded-full px-4 py-2 text-xs ${
                    planCurrency === currency
                      ? "border border-white/20 bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {intervals.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setInterval(item)}
                  className={`rounded-full px-4 py-2 text-xs ${
                    interval.label === item.label
                      ? "border border-white/20 bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {state.plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{plan.name}</div>
                    <div className="text-xs text-white/40">
                      {plan.intervalLabel} · created {formatDateTime(plan.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/70">
                      {formatCurrencyAmount(plan.amount, plan.currency)}
                    </div>
                    <button
                      onClick={() => setSelectedPlanId(plan.id)}
                      className="mt-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/65"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">Subscribers</div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-3">
                <input
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                  value={subscriberName}
                  onChange={(event) => setSubscriberName(event.target.value)}
                  placeholder="Customer name"
                />
                <input
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                  value={subscriberEmail}
                  onChange={(event) => setSubscriberEmail(event.target.value)}
                  placeholder="Customer email"
                />
                <select
                  value={selectedPlanId}
                  onChange={(event) => setSelectedPlanId(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75 outline-none"
                >
                  {state.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    actions.addSubscriber({
                      planId: selectedPlanId,
                      customer: subscriberName,
                      email: subscriberEmail,
                      seats: 1,
                    })
                  }
                  className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-black"
                >
                  Add subscriber
                </button>
              </div>
            </div>

            {state.subscriptions.map((subscription) => {
              const plan = state.plans.find((item) => item.id === subscription.planId);
              return (
                <div key={subscription.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{subscription.customer}</div>
                      <div className="mt-1 text-xs text-white/40">
                        {plan?.name} · next renewal {formatDateTime(subscription.nextBillingAt)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge
                        label={
                          subscription.status === "active"
                            ? "Active"
                            : subscription.status === "paused"
                              ? "Pending"
                              : "Expired"
                        }
                      />
                      <button
                        onClick={() => actions.recordRenewal(subscription.id)}
                        className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/70"
                      >
                        Generate renewal
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
