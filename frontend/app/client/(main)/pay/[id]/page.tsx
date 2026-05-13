"use client";

import { useEffect } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  CreditCard,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { usePlanStore } from "@/store/usePayment";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const paymentId = params.id as string;

  const {
    currentPayment,
    loading,
    fetchPaymentById,
    payForSubscription,
  } = usePlanStore();

  useEffect(() => {
    if (paymentId) {
      fetchPaymentById(paymentId);
    }
  }, [paymentId]);

  const handlePay = async () => {
    const success = await payForSubscription(paymentId);

    if (success) {
      router.replace("/profile");
    }
  };

  if (loading && !currentPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!currentPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Payment not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md items-center p-4">

        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

          <div className="mb-8 text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
              <CreditCard size={28} />
            </div>

            <h1 className="text-2xl font-bold">
              Complete Payment
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Demo payment gateway
            </p>
          </div>

          <div className="space-y-5">

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

              <p className="text-sm text-zinc-400">
                Amount
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                ₹{currentPayment.amount}
              </h2>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-zinc-400">
                  Status
                </span>

                <div
                  className={`rounded-full px-3 py-1 text-xs ${
                    currentPayment.status === "succeeded"
                      ? "bg-green-500/10 text-green-400"
                      : currentPayment.status === "pending"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {currentPayment.status}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

              <p className="mb-2 text-sm text-zinc-400">
                Payment ID
              </p>

              <p className="break-all font-mono text-xs text-zinc-500">
                {currentPayment.id}
              </p>
            </div>

            {currentPayment.status === "pending" ? (
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? (
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
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-400">
                <CheckCircle2 size={18} />

                Payment Completed
              </div>
            )}

            <button
              onClick={() => router.push("/client/plans")}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}