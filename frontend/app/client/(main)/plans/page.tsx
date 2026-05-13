"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Crown,
  Loader2,
  Check,
  CalendarDays,
  Plus,
} from "lucide-react";

import { usePlanStore } from "@/store/usePayment";
import { useAuthStore } from "@/store/useAuth";

export default function PlansPage() {
  const {
    plans,
    activeSubscription,
    loading,
    fetchPlans,
    fetchActiveSubscription,
    subscribeToPlan,
    createPlan,
  } = usePlanStore();

  const { user } = useAuthStore();

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "",
  });

  useEffect(() => {
    fetchPlans();
    fetchActiveSubscription();
  }, []);

  const handleBuy = async (planId: string) => {
    const data = await subscribeToPlan(planId);

    if (!data?.payment?.id) return;

    window.location.href = `/client/pay/${data.payment.id}`;
  };

  const handleCreate = async () => {
    const success = await createPlan({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
    });

    if (success) {
      setForm({
        name: "",
        description: "",
        price: "",
        durationDays: "",
      });

      setShowCreate(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl p-4 md:p-8">

        {/* HEADER */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Plans
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Upgrade your account and unlock premium features
            </p>
          </div>

          {user?.isOwner && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <Plus size={18} />

              Create Plan
            </button>
          )}
        </div>

        {/* CREATE PLAN */}
        {showCreate && (
          <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

            <h2 className="mb-6 text-xl font-semibold">
              Create New Plan
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <input
                type="text"
                placeholder="Plan name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              />

              <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              />

              <input
                type="number"
                placeholder="Duration days"
                value={form.durationDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationDays: e.target.value,
                  })
                }
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              />

              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              Create Plan
            </button>
          </div>
        )}

        {/* CURRENT PLAN */}
        <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-zinc-800 p-3">
                  <Crown size={22} />
                </div>

                <div>
                  <p className="text-sm text-zinc-400">
                    Current Subscription
                  </p>

                  <h2 className="text-xl font-semibold">
                    {activeSubscription
                      ? activeSubscription.status === "active"
                        ? "Premium Active"
                        : "Subscription Expired"
                      : "Free Plan"}
                  </h2>
                </div>
              </div>

              {activeSubscription && (
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-400">

                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />

                    <span>
                      Ends {formatDate(activeSubscription.endDate)}
                    </span>
                  </div>

                  <div
                    className={`rounded-full border px-3 py-1 text-xs ${
                      activeSubscription.status === "active"
                        ? "border-green-500/20 bg-green-500/10 text-green-400"
                        : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {activeSubscription.status}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/client/profile"
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm transition hover:bg-zinc-800"
            >
              Manage Account
            </Link>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {plans.map((plan) => {
            const isCurrent =
              activeSubscription?.planId === plan.id &&
              activeSubscription?.status === "active";

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-3xl border p-6 ${
                  isCurrent
                    ? "border-white bg-zinc-900"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >

                {isCurrent && (
                  <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
                    Current
                  </div>
                )}

                <div className="mb-6">

                  <h2 className="text-2xl font-bold">
                    {plan.name}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-400">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">
                      ₹{plan.price}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {plan.durationDays} days access
                  </p>
                </div>

                <div className="mb-8 space-y-3">

                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check size={16} className="text-green-400" />
                    Premium access
                  </div>

                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check size={16} className="text-green-400" />
                    Faster support
                  </div>

                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check size={16} className="text-green-400" />
                    Unlimited usage
                  </div>
                </div>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-400"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
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