"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/useAuth";
import GuestRoute from "@/components/LoginRouter";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, checkAuth } = useAuthStore();
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    const init = async () => {
      const authUser = await checkAuth();
      if (authUser) router.push("/client");
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(formData);
    if (success) router.push("/client");
  };

  return (
    <GuestRoute>
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 overflow-hidden">

      {/* Static grid background */}
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

      {/* Subtle radial glow behind card */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">

        {/* Top label */}
        <p className="mb-3 text-xs font-medium tracking-widest text-zinc-500 uppercase">
          Welcome back
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-md">
          <h1 className="mb-1 text-2xl font-semibold text-white tracking-tight">
            Sign in
          </h1>
          <p className="mb-7 text-sm text-zinc-500">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Email field */}
            <div className="group">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 text-sm text-white outline-none placeholder:text-zinc-600 transition-colors focus:border-zinc-600"
              />
            </div>

            {/* Password field */}
            <div className="group">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400">
                  Password
                </label>
                <Link href="/auth/forgot" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 text-sm text-white outline-none placeholder:text-zinc-700 transition-colors focus:border-zinc-600"
              />
            </div>

            {/* Divider */}
            <div className="pt-2">
              <button
                disabled={loading}
                className="h-11 w-full rounded-lg bg-white text-sm font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-40"
              >
                {loading ? "Signing in..." : "Continue"}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <p className="mt-5 text-center text-sm text-zinc-500">
            No account?{" "}
            <Link href="/auth/signup" className="text-zinc-300 hover:text-white transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
    </GuestRoute>
  );
}