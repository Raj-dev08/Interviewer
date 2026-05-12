"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/useAuth";

export default function LoginPage() {
  const router = useRouter();

  const {
    login,
    user,
    loading,
    checkAuth,
  } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const init = async () => {
      const authUser = await checkAuth();

      if (authUser) {
        router.push("/dashboard");
      }
    };

    init();
  }, []);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const success = await login(formData);

    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-6 text-3xl font-bold">
          Login
        </h1>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
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
              : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-white"
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}