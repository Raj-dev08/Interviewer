"use client";

import { useEffect } from "react";

import {
  IndianRupee,
  CreditCard,
  Users,
  Crown,
  Loader2,
} from "lucide-react";

import { usePlanStore } from "@/store/usePayment";

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-5 h-12 w-12 rounded-2xl bg-zinc-800" />

      <div className="h-4 w-28 rounded bg-zinc-800" />

      <div className="mt-4 h-10 w-36 rounded bg-zinc-800" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const {
    payments,
    plans,
    totalRevenue,
    activeSubscriptionsCount,
    loading,

    fetchPayments,
    fetchPlans,
    fetchTotalRevenue,
    fetchActiveSubscriptionsCount,
  } = usePlanStore();

  useEffect(() => {
    fetchPayments();
    fetchPlans();
    fetchTotalRevenue();
    fetchActiveSubscriptionsCount();
  }, []);

  const successfulPayments =
    payments.filter(
      (payment) =>
        payment.status === "succeeded"
    );

  const pendingPayments =
    payments.filter(
      (payment) =>
        payment.status === "pending"
    );

  const failedPayments =
    payments.filter(
      (payment) =>
        payment.status === "failed"
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-7xl p-4 md:p-8">

        {/* HEADER */}
        <div className="mb-10">

          <div className="flex items-center gap-3">

            <div className="rounded-2xl bg-zinc-900 p-3">
              <Crown size={24} />
            </div>

            <div>

              <h1 className="text-4xl font-bold tracking-tight">
                Admin Dashboard
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Monitor subscriptions, payments and revenue
              </p>

            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {loading &&
          payments.length === 0 ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

                <div className="mb-5 inline-flex rounded-2xl bg-zinc-800 p-3">
                  <IndianRupee size={22} />
                </div>

                <p className="text-sm text-zinc-400">
                  Total Revenue
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  ₹{totalRevenue}
                </h2>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

                <div className="mb-5 inline-flex rounded-2xl bg-zinc-800 p-3">
                  <Users size={22} />
                </div>

                <p className="text-sm text-zinc-400">
                  Active Subscriptions
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  {
                    activeSubscriptionsCount
                  }
                </h2>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

                <div className="mb-5 inline-flex rounded-2xl bg-zinc-800 p-3">
                  <CreditCard size={22} />
                </div>

                <p className="text-sm text-zinc-400">
                  Successful Payments
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  {
                    successfulPayments.length
                  }
                </h2>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

                <div className="mb-5 inline-flex rounded-2xl bg-zinc-800 p-3">
                  <Loader2 size={22} />
                </div>

                <p className="text-sm text-zinc-400">
                  Pending Payments
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  {
                    pendingPayments.length
                  }
                </h2>
              </div>
            </>
          )}
        </div>

        {/* PLANS */}
        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-semibold">
                Plans
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                All subscription plans
              </p>

            </div>

            <div className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              {plans.length} plans
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
              >

                <div className="mb-5 inline-flex rounded-2xl bg-zinc-800 p-3">
                  <Crown size={20} />
                </div>

                <h3 className="text-2xl font-bold">
                  {plan.name}
                </h3>

                <p className="mt-3 text-sm text-zinc-400">
                  {plan.description}
                </p>

                <div className="mt-6">

                  <span className="text-4xl font-bold">
                    ₹{plan.price}
                  </span>

                  <span className="ml-2 text-zinc-500">
                    / {plan.durationDays} days
                  </span>
                </div>

                <div className="mt-6 space-y-3">

                  {plan.features
                    .split(",")
                    .map(
                      (
                        feature,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm text-zinc-300"
                        >

                          <div className="h-2 w-2 rounded-full bg-green-400" />

                          <span>
                            {feature}
                          </span>
                        </div>
                      )
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENTS */}
        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-semibold">
                Payments
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Latest transactions
              </p>

            </div>

            <div className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              {payments.length} payments
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead>

                <tr className="border-b border-zinc-800 text-left text-sm text-zinc-500">

                  <th className="pb-4 font-medium">
                    Payment ID
                  </th>

                  <th className="pb-4 font-medium">
                    Amount
                  </th>

                  <th className="pb-4 font-medium">
                    Month
                  </th>

                  <th className="pb-4 font-medium">
                    Year
                  </th>

                  <th className="pb-4 font-medium">
                    Status
                  </th>

                  <th className="pb-4 font-medium">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>

                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-zinc-900 text-sm"
                  >

                    <td className="py-5 text-zinc-300">
                      {payment.id.slice(
                        0,
                        10
                      )}
                      ...
                    </td>

                    <td className="py-5 font-medium">
                      ₹{payment.amount}
                    </td>

                    <td className="py-5 text-zinc-400">
                      {
                        payment.forMonth
                      }
                    </td>

                    <td className="py-5 text-zinc-400">
                      {
                        payment.forYear
                      }
                    </td>

                    <td className="py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-xs capitalize ${
                          payment.status ===
                          "succeeded"
                            ? "bg-green-500/10 text-green-400"
                            : payment.status ===
                              "pending"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="py-5 text-zinc-400">
                      {new Date(
                        payment.date
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="py-16 text-center text-zinc-500">
                No payments found
              </div>
            )}
          </div>
        </div>

        {/* EXTRA STATS */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

            <p className="text-sm text-zinc-400">
              Failed Payments
            </p>

            <h2 className="mt-3 text-4xl font-bold text-red-400">
              {failedPayments.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

            <p className="text-sm text-zinc-400">
              Total Transactions
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              {payments.length}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}