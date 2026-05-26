"use client";

import { useEffect, useState } from "react";

import {
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  CreditCard,
  Check,
} from "lucide-react";

import { usePlanStore } from "@/store/usePayment";

export default function AdminPlansPage() {
  const {
    plans,
    loading,
    fetchPlans,
    createPlan,
  } = usePlanStore();

  const [showCreate, setShowCreate] =
    useState(false);

  const [featureInput, setFeatureInput] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: "",
    features: [] as string[],
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const addFeature = () => {
    if (!featureInput.trim()) return;

    setForm({
      ...form,
      features: [
        ...form.features,
        featureInput.trim(),
      ],
    });

    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    setForm({
      ...form,
      features: form.features.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleCreate = async () => {
    if (
      !form.name ||
      !form.description ||
      !form.price ||
      !form.durationDays
    ) {
      return;
    }

    const success = await createPlan({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationDays: Number(
        form.durationDays
      ),
      features: form.features.join(","),
    });

    if (success) {
      setForm({
        name: "",
        description: "",
        price: "",
        durationDays: "",
        features: [],
      });

      setFeatureInput("");
      setShowCreate(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl p-4 md:p-8">

        {/* HEADER */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Manage Plans
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Create and manage premium subscription plans
            </p>
          </div>

          <button
            onClick={() =>
              setShowCreate(!showCreate)
            }
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <Plus size={18} />

            {showCreate
              ? "Close"
              : "Create Plan"}
          </button>
        </div>

        {/* CREATE */}
        {showCreate && (
          <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* FORM */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">

              <div className="mb-8 flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-semibold">
                    New Plan
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    Configure pricing and features
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
                  Admin
                </div>
              </div>

              <div className="space-y-5">

                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Plan Name
                  </label>

                  <input
                    type="text"
                    placeholder="Premium Plus"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 outline-none transition focus:border-zinc-600"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Description
                  </label>

                  <textarea
                    placeholder="Best for serious interview preparation"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    className="min-h-[120px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 outline-none transition focus:border-zinc-600"
                  />
                </div>

                {/* PRICE + DURATION */}
                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      Price
                    </label>

                    <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-950 px-4">

                      <span className="mr-2 text-zinc-500">
                        ₹
                      </span>

                      <input
                        type="number"
                        placeholder="499"
                        value={form.price}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            price:
                              e.target.value,
                          })
                        }
                        className="w-full bg-transparent py-4 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      Duration
                    </label>

                    <input
                      type="number"
                      placeholder="30"
                      value={form.durationDays}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          durationDays:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 outline-none transition focus:border-zinc-600"
                    />
                  </div>
                </div>

                {/* FEATURES */}
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Features
                  </label>

                  <div className="flex gap-3">

                    <input
                      type="text"
                      placeholder="Unlimited interviews"
                      value={featureInput}
                      onChange={(e) =>
                        setFeatureInput(
                          e.target.value
                        )
                      }
                      className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 outline-none transition focus:border-zinc-600"
                    />

                    <button
                      type="button"
                      onClick={addFeature}
                      className="rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
                    >
                      Add
                    </button>
                  </div>

                  {form.features.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">

                      {form.features.map(
                        (
                          feature,
                          index
                        ) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
                          >
                            {feature}

                            <button
                              onClick={() =>
                                removeFeature(
                                  index
                                )
                              }
                              className="text-red-400 transition hover:text-red-300"
                            >
                              <Trash2
                                size={14}
                              />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>

            {/* PREVIEW */}
            <div className="h-fit rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">

              <div className="flex items-center justify-between">

                <div className="rounded-2xl bg-white/10 p-3">
                  <CreditCard size={22} />
                </div>

                <div className="flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                  <Sparkles size={12} />

                  Live Preview
                </div>
              </div>

              <div className="mt-8">

                <h2 className="text-3xl font-bold">
                  {form.name ||
                    "Premium Plan"}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {form.description ||
                    "Your subscription plan preview will appear here."}
                </p>
              </div>

              <div className="mt-8">

                <div className="flex items-end gap-2">

                  <span className="text-5xl font-bold">
                    ₹
                    {form.price || 0}
                  </span>

                  <span className="pb-1 text-zinc-500">
                    /
                    {" "}
                    {form.durationDays ||
                      0}
                    {" "}
                    days
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3">

                {form.features.length >
                0 ? (
                  form.features.map(
                    (
                      feature,
                      index
                    ) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300"
                      >
                        <Check
                          size={16}
                          className="text-green-400"
                        />

                        {feature}
                      </div>
                    )
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
                    No features added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EXISTING PLANS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"
            >

              <div className="mb-6 flex items-center justify-between">

                <div className="rounded-2xl bg-zinc-800 p-3">
                  <CreditCard size={20} />
                </div>

                <div className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                  Active
                </div>
              </div>

              <h2 className="text-2xl font-bold">
                {plan.name}
              </h2>

              <p className="mt-3 text-sm text-zinc-400">
                {plan.description}
              </p>

              <div className="mt-8 flex items-end gap-2">

                <span className="text-4xl font-bold">
                  ₹{plan.price}
                </span>

                <span className="pb-1 text-zinc-500">
                  / {plan.durationDays} days
                </span>
              </div>

              <div className="mt-8 space-y-3">

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
                          className="text-green-400"
                        />

                        {feature}
                      </div>
                    )
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}