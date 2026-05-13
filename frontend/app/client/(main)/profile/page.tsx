"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Crown,
  KeyRound,
  Loader2,
  LogOut,
  ShieldAlert,
  Trash2,
  User2,
} from "lucide-react";

import { useAuthStore } from "@/store/useAuth";

export default function ProfilePage() {
  const router = useRouter();

  const {
    user,
    loading,
    logout,
    disableAccount,
    enableAccount,
    deleteAccount,
    changePassword,
  } = useAuthStore();

  const [showPasswordBox, setShowPasswordBox] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [error, setError] = useState("");

  const handleLogout = async () => {
    const success = await logout();

    if (success) {
      router.replace("/auth/login");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Delete your account permanently?"
    );

    if (!confirmDelete) return;

    const success = await deleteAccount();

    if (success) {
      router.replace("/auth/signup");
    }
  };

  const handleDisable = async () => {
    const confirmDisable = window.confirm(
      "Disable your account?"
    );

    if (!confirmDisable) return;

    const success = await disableAccount();

    if (success) {
      router.replace("/auth/login");
    }
  };

  const handleEnable = async () => {
    await enableAccount();
  };

  const handlePasswordChange = async () => {
    setError("");

    if (!form.currentPassword || !form.newPassword) {
      setError("All fields are required");
      return;
    }

    if (form.newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    const success = await changePassword(form);

    if (success) {
      setForm({
        currentPassword: "",
        newPassword: "",
      });

      setShowPasswordBox(false);
    } else {
      setError("Invalid current password");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl p-4 md:p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Profile
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Manage your account and settings
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">

          {/* Left */}
          <div className="space-y-6 xl:col-span-2">

            {/* User Card */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
                  <User2 size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    {user?.name}
                  </h2>

                  <p className="text-sm text-zinc-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">
                    Account Type
                  </p>

                  <p className="mt-2 font-semibold">
                    {user?.isOwner
                      ? "Admin"
                      : "User"}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400">
                    Subscription
                  </p>

                  <p className="mt-2 font-semibold">
                    {user?.isPaid
                      ? "Premium"
                      : "Free Tier"}
                  </p>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

              <button
                onClick={() =>
                  setShowPasswordBox(!showPasswordBox)
                }
                className="flex w-full items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    Password
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    Update your password
                  </p>
                </div>

                <KeyRound size={20} />
              </button>

              {showPasswordBox && (
                <div className="mt-6 space-y-4">

                  <input
                    type="password"
                    placeholder="Current password"
                    value={form.currentPassword}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                  />

                  <input
                    type="password"
                    placeholder="New password"
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                  />

                  {error && (
                    <p className="text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {loading && (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    )}

                    Update Password
                  </button>
                </div>
              )}
            </div>

            {/* Danger */}
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">

              <div className="flex items-center gap-3">
                <ShieldAlert className="text-red-400" />

                <div>
                  <h3 className="font-semibold text-red-400">
                    Danger Zone
                  </h3>

                  <p className="text-sm text-zinc-400">
                    Irreversible account actions
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">

                {user?.isDisabled ? (
                  <button
                    onClick={handleEnable}
                    disabled={loading}
                    className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    Enable Account
                  </button>
                ) : (
                  <button
                    onClick={handleDisable}
                    disabled={loading}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Disable Account
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 px-4 py-3 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={18} />

                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">

            {/* Plan */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

              <div className="flex items-center gap-3">
                <Crown />

                <div>
                  <h3 className="font-semibold">
                    Current Plan
                  </h3>

                  <p className="text-sm text-zinc-400">
                    {user?.isPaid
                      ? "Premium Active"
                      : "Free Tier"}
                  </p>
                </div>
              </div>

              <Link
                href="/client/plans"
                className={`mt-6 block rounded-2xl px-4 py-3 text-center font-medium transition ${
                  user?.isPaid
                    ? "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {user?.isPaid
                  ? "Manage Plan"
                  : "Upgrade Plan"}
              </Link>
            </div>

            {/* Logout */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">

              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800 disabled:opacity-50"
              >
                <LogOut size={18} />

                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}