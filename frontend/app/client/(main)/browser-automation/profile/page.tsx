
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAutomationStore } from "@/store/useAutomation";

export default function AutomationProfilePage() {
  const router = useRouter();
  const { profile, loading, fetchAutomationData } = useAutomationStore();

  useEffect(() => {
    if (!profile) fetchAutomationData();
  }, [profile, fetchAutomationData]);

  if (loading && !profile) return <main className="min-h-screen bg-zinc-950 p-6 text-zinc-400">Loading profile...</main>;

  const fields = [
    ["Account email", profile?.email],
    ["Email connected", profile?.emailConnected ? "Yes" : "No"],
    ["Automation enabled", profile?.automationEnabled ? "Yes" : "No"],
    ["Timezone", profile?.timezone],
    ["LinkedIn profile", profile?.linkdinProfile],
    ["Connection status", profile?.browserSession?.status],
  ];

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={() => router.back()} className="text-sm text-indigo-400 hover:text-indigo-300">
          ← Back to automation
        </button>

        <div>
          <h1 className="text-2xl font-bold">Profile details</h1>
          <p className="mt-1 text-sm text-zinc-400">Your saved automation account information.</p>
        </div>

        <section className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900 px-5">
          {fields.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 py-4 sm:flex-row sm:justify-between">
              <span className="text-sm text-zinc-400">{label}</span>
              <span className="break-all text-sm text-white">{value || "Not set"}</span>
            </div>
          ))}
        </section>

        <button onClick={() => router.push("/client/browser-automation/preferences")} className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">
          Edit job preferences
        </button>
      </div>
    </main>
  );
}
