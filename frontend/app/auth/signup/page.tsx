"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuth";
import GuestRoute from "@/components/LoginRouter";

export default function SignupPage() {
  const router = useRouter();

  const { sendOtp, verifyOtp, loading } = useAuthStore();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await sendOtp({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      birthday: "",
      gender: "other",
    });

    if (success) setStep(2);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await verifyOtp({
      email: formData.email,
      otp: formData.otp,
    });

    if (success) router.push("/client");
  };

  return (
    <GuestRoute>
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 overflow-hidden">

      {/* grid background (same as login) */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "88px 88px",
        }}
      />

      {/* subtle glow (same system) */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 650,
          height: 650,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* card */}
      <div className="relative z-10 w-full max-w-md">

        {/* top label */}
        <p className="mb-3 text-xs font-medium tracking-widest text-zinc-500 uppercase">
          Create account
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-md shadow-2xl">

          <h1 className="mb-1 text-2xl font-semibold text-white tracking-tight">
            Sign up
          </h1>

          <p className="mb-7 text-sm text-zinc-500">
            Create your account to continue
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">

              {/* name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-zinc-600"
                />
              </div>

              {/* email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-zinc-600"
                />
              </div>

              {/* password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-zinc-600"
                />
              </div>

              {/* submit */}
              <button
                disabled={loading}
                className="h-11 w-full rounded-lg bg-white text-sm font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-40"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">

              {/* otp */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  OTP
                </label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 text-sm text-white outline-none placeholder:text-zinc-700 transition focus:border-zinc-600"
                />
              </div>

              {/* submit */}
              <button
                disabled={loading}
                className="h-11 w-full rounded-lg bg-white text-sm font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-40"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {/* divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* login link */}
          <p className="mt-5 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-zinc-300 hover:text-white transition"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
    </GuestRoute>
  );
}