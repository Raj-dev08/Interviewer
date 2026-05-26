"use client";

import { useEffect, useState } from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  CreditCard,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { usePlanStore } from "@/store/usePayment";

export default function PaymentPage() {
  const params = useParams();

  const router = useRouter();

  const paymentId = params.id as string;

  const {
    currentPayment,
    fetchPaymentById,
    payForSubscription,
  } = usePlanStore();

  const [pageLoading, setPageLoading] =
    useState(true);

  const [payLoading, setPayLoading] =
    useState(false);

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) return;

      setPageLoading(true);

      await fetchPaymentById(paymentId);

      setPageLoading(false);
    };

    loadPayment();
  }, [paymentId]);

  const handlePay = async () => {
    setPayLoading(true);

    const success =
      await payForSubscription(paymentId);

    setPayLoading(false);

    if (success) {
      router.replace("/client/profile");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2
          size={28}
          className="animate-spin"
        />
      </div>
    );
  }

  if (!currentPayment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white">

        <p className="text-zinc-400">
          Payment not found
        </p>

        <button
          onClick={() =>
            router.push("/client/plans")
          }
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 transition hover:bg-zinc-800"
        >
          Back to Plans
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto flex min-h-screen max-w-lg items-center p-4">

        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">

          {/* TOP */}
          <div className="mb-8 text-center">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-800">
              <CreditCard size={34} />
            </div>

            <h1 className="text-3xl font-bold">
              Complete Payment
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Demo payment checkout
            </p>
          </div>

          {/* AMOUNT */}
          <div className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <p className="text-sm text-zinc-400">
              Total Amount
            </p>

            <div className="mt-3 flex items-end gap-2">

              <span className="text-5xl font-bold">
                ₹
                {currentPayment.amount}
              </span>

            </div>
          </div>

          {/* STATUS */}
          <div className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-zinc-400">
                Payment Status
              </span>

              <div
                className={`rounded-full px-4 py-2 text-xs font-medium capitalize ${
                  currentPayment.status ===
                  "succeeded"
                    ? "bg-green-500/10 text-green-400"
                    : currentPayment.status ===
                      "pending"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {currentPayment.status}
              </div>
            </div>
          </div>

          {/* PAYMENT ID */}
          <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <p className="mb-3 text-sm text-zinc-400">
              Payment ID
            </p>

            <p className="break-all rounded-2xl bg-zinc-900 p-3 font-mono text-xs text-zinc-500">
              {currentPayment.id}
            </p>
          </div>

          {/* ACTION */}
          {currentPayment.status ===
          "pending" ? (
            <button
              onClick={handlePay}
              disabled={payLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {payLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CreditCard size={18} />
              )}

              Pay Now
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-4 font-medium text-green-400">

              <CheckCircle2 size={20} />

              Payment Completed
            </div>
          )}

          {/* BACK */}
          <button
            onClick={() =>
              router.push("/client/plans")
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 transition hover:bg-zinc-800"
          >

            <ArrowLeft size={18} />

            Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
}