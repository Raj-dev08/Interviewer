
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAutomationStore } from "@/store/useAutomation";

export default function BrowserAutomationPage() {
  const { profile, browserStatus, loading, connecting, fetchAutomationData, connectLinkedIn, refreshBrowserStatus, confirmLinkedInLogin, closeBrowser } = useAutomationStore();

  useEffect(() => {
    fetchAutomationData();
    const interval = setInterval(refreshBrowserStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchAutomationData, refreshBrowserStatus]);

  const connected = browserStatus === "connected";
  const waiting = ["waiting_for_login", "closed", "verification_required"].includes(browserStatus);
  const linkedin = profile?.linkedinProfile;

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-sm text-indigo-400">Automation</p>
          <h1 className="text-2xl font-bold">LinkedIn job automation</h1>
          <p className="mt-2 text-sm text-zinc-400">Connect your LinkedIn account to prepare your job search.</p>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">LinkedIn account</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Status: <span className={connected ? "text-emerald-400" : "text-amber-400"}>{browserStatus.replaceAll("_", " ")}</span>
              </p>
            </div>
            {connected && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">Connected</span>}
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-zinc-400">Loading account...</p>
          ) : connected ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg bg-zinc-800/60 p-4">
                {linkedin?.pictureUrl && <img src={linkedin.pictureUrl} alt="Profile" className="mb-3 h-14 w-14 rounded-full object-cover" />}
                <p className="font-medium">{linkedin?.name || "LinkedIn account connected"}</p>
                {linkedin?.headline && <p className="mt-1 text-sm text-zinc-400">{linkedin.headline}</p>}
                {linkedin?.location && <p className="mt-1 text-sm text-zinc-500">{linkedin.location}</p>}
                {linkedin?.profileUrl && <a href={linkedin.profileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">View LinkedIn profile</a>}
                {!linkedin && <p className="mt-2 text-sm text-zinc-400">Your session is connected. Profile details are not available yet.</p>}
              </div>

              <div className="flex flex-wrap gap-3">
                <button disabled className="rounded-lg bg-indigo-600/50 px-4 py-2 text-sm font-medium opacity-70">
                  Run job scraping · Coming soon
                </button>
                <button onClick={closeBrowser} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
                  Disconnect
                </button>
              </div>
            </div>
          ) : waiting ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h3 className="font-medium text-amber-300">LinkedIn login</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Log in to LinkedIn in the browser window. Once done, return here and confirm your login.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={confirmLinkedInLogin} disabled={connecting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50">
                  {connecting ? "Checking LinkedIn..." : "I've logged in, confirm"}
                </button>

                <button onClick={refreshBrowserStatus} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
                  Refresh status
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-zinc-400">
                Your LinkedIn account isn't connected. Open the login browser and sign in to continue.
              </p>

              <button onClick={connectLinkedIn} disabled={connecting || browserStatus === "opening"} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50">
                {connecting || browserStatus === "opening" ? "Opening browser..." : "Connect LinkedIn"}
              </button>
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link href="browser-automation/profile" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600">
            <h2 className="font-semibold">Profile details</h2>
            <p className="mt-2 text-sm text-zinc-400">View your automation account details.</p>
            <span className="mt-4 inline-block text-sm text-indigo-400">Manage profile →</span>
          </Link>

          <Link href="browser-automation/preferences" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600">
            <h2 className="font-semibold">Job preferences</h2>
            <p className="mt-2 text-sm text-zinc-400">Configure roles, keywords, locations and job filters.</p>
            <span className="mt-4 inline-block text-sm text-indigo-400">Edit preferences →</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
