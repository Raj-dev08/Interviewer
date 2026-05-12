"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuth";

export default function SignupPage() {
  const router = useRouter();

  const {
    sendOtp,
    verifyOtp,
    loading,
  } = useAuthStore();

  const [step, setStep] = useState(1);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      otp: "",
    });

  const handleSendOtp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const success = await sendOtp({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      birthday: "",
      gender: "other",
    });

    if (success) {
      setStep(2);
    }
  };

  const handleVerifyOtp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const success = await verifyOtp({
      email: formData.email,
      otp: formData.otp,
    });

    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-6 text-3xl font-bold">
          Signup
        </h1>

        {step === 1 ? (
          <form
            onSubmit={handleSendOtp}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 outline-none"
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 outline-none"
            />

            <button
              disabled={loading}
              className="h-12 w-full rounded-xl bg-white font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Send OTP"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="OTP"
              value={formData.otp}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  otp: e.target.value,
                })
              }
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 outline-none"
            />

            <button
              disabled={loading}
              className="h-12 w-full rounded-xl bg-white font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Verify OTP"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-white"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}