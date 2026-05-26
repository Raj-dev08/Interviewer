"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  Crown,
  Loader2,
  Check,
  CalendarDays,
} from "lucide-react";

import { usePlanStore } from "@/store/usePayment";

function PlanSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/50 p-7">
      <div className="mb-8">
        <div className="mb-5 h-12 w-12 rounded-2xl bg-zinc-800" />

        <div className="h-8 w-40 rounded bg-zinc-800" />

        <div className="mt-3 h-4 w-full rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-3/4 rounded bg-zinc-800" />
      </div>

      <div className="mb-8">
        <div className="h-12 w-32 rounded bg-zinc-800" />
      </div>

      <div className="mb-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3"
          >
            <div className="h-4 w-4 rounded-full bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="h-14 w-full rounded-2xl bg-zinc-800" />
    </div>
  );
}

export default function Page() {
  const {
    plans,
    activeSubscription,
    loading,
    fetchPlans,
    fetchActiveSubscription,
    subscribeToPlan,
  } = usePlanStore();

  useEffect(() => {
    Promise.all([
      fetchPlans(),
      fetchActiveSubscription(),
    ]);
  }, []);

  const isPageLoading =
    loading &&
    plans.length === 0;

  const handleBuy = async (
    planId: string
  ) => {
    const res = await subscribeToPlan(
      planId
    );

    if (!res.success || !res.paymentId) {
      return;
    }

    window.location.href = `/client/pay/${res.paymentId}`;
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) return "";

    return new Date(
      date
    ).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl p-4 md:p-8">

        {/* HEADER */}
        <div className="mb-12">

          <div className="flex items-center gap-3">

            <div className="rounded-2xl bg-zinc-900 p-3">
              <Crown size={24} />
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Pricing Plans
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Upgrade your account and unlock premium features
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE PLAN */}
        <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="rounded-2xl bg-zinc-800 p-3">
                  <CalendarDays size={22} />
                </div>

                <div>

                  <p className="text-sm text-zinc-400">
                    Current Subscription
                  </p>

                  {isPageLoading ? (
                    <div className="mt-2 h-8 w-48 animate-pulse rounded bg-zinc-800" />
                  ) : (
                    <h2 className="text-2xl font-semibold">

                      {activeSubscription
                        ? activeSubscription.status ===
                          "active"
                          ? "Premium Active"
                          : activeSubscription.status ===
                            "canceled"
                            ? "Subscription Canceled"
                            : "Subscription Expired"
                        : "Free Plan"}

                    </h2>
                  )}
                </div>
              </div>

              {!isPageLoading &&
                activeSubscription && (
                  <div className="mt-5 flex flex-wrap gap-3">

                    <div className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">

                      Ends on{" "}
                      {formatDate(
                        activeSubscription.endDate
                      )}

                    </div>

                    <div
                      className={`rounded-full border px-4 py-2 text-sm capitalize ${
                        activeSubscription.status ===
                        "active"
                          ? "border-green-500/20 bg-green-500/10 text-green-400"
                          : activeSubscription.status ===
                            "canceled"
                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                            : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {
                        activeSubscription.status
                      }
                    </div>
                  </div>
                )}
            </div>

            <div className="flex flex-wrap gap-3">

              {activeSubscription &&
                activeSubscription.status ===
                  "active" && (
                  <button
                    onClick={async () => {
                      await usePlanStore
                        .getState()
                        .cancelSubscription(
                          activeSubscription.id
                        );

                      await fetchActiveSubscription();
                    }}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >

                    {loading && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    Cancel Subscription
                  </button>
                )}

              <Link
                href="/client/profile"
                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm transition hover:bg-zinc-800"
              >
                Manage Account
              </Link>
            </div>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {isPageLoading
            ? Array.from({ length: 3 }).map(
                (_, index) => (
                  <PlanSkeleton
                    key={index}
                  />
                )
              )
            : plans.map((plan) => {
                const isCurrent =
                  activeSubscription?.planId ===
                    plan.id &&
                  activeSubscription?.status ===
                    "active";

                return (
                  <div
                    key={plan.id}
                    className={`relative overflow-hidden rounded-3xl border p-7 transition ${
                      isCurrent
                        ? "border-white bg-zinc-900"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    }`}
                  >

                    {isCurrent && (
                      <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                        Current Plan
                      </div>
                    )}

                    {/* TOP */}
                    <div className="mb-8">

                      <div className="mb-5 inline-flex rounded-2xl bg-zinc-800 p-3">
                        <Crown size={22} />
                      </div>

                      <h2 className="text-3xl font-bold">
                        {plan.name}
                      </h2>

                      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                        {plan.description}
                      </p>
                    </div>

                    {/* PRICE */}
                    <div className="mb-8">

                      <div className="flex items-end gap-2">

                        <span className="text-5xl font-bold">
                          ₹{plan.price}
                        </span>

                        <span className="pb-1 text-zinc-500">
                          /{" "}
                          {
                            plan.durationDays
                          }{" "}
                          days
                        </span>
                      </div>
                    </div>

                    {/* FEATURES */}
                    <div className="mb-8 space-y-4">

                      {plan.features
                        ?.split(",")
                        .map(
                          (
                            feature: string,
                            index: number
                          ) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 text-sm text-zinc-300"
                            >
                              <Check
                                size={16}
                                className="shrink-0 text-green-400"
                              />

                              <span>
                                {feature}
                              </span>
                            </div>
                          )
                        )}
                    </div>

                    {/* BUTTON */}
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-2xl bg-zinc-800 px-4 py-4 font-medium text-zinc-400"
                      >
                        Active Plan
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleBuy(plan.id)
                        }
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >

                        {loading && (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        )}

                        Buy Plan
                      </button>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}