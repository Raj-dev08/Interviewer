"use client";

export default function InterviewFinishedScreen({
    onGoDashboard,
    onReload,
}: {
    onGoDashboard: () => void;
    onReload: () => void;
}) {
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">

                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="text-green-400 text-2xl">✓</span>
                </div>

                <h1 className="text-2xl font-bold mb-2">
                    Interview Completed
                </h1>

                <p className="text-zinc-400 mb-6">
                    Your responses have been submitted successfully.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                    <div className="rounded-lg bg-zinc-800 p-3">
                        <p className="text-zinc-400">Status</p>
                        <p className="text-green-400 font-semibold">Submitted</p>
                    </div>

                    <div className="rounded-lg bg-zinc-800 p-3">
                        <p className="text-zinc-400">Time</p>
                        <p className="font-mono">Completed</p>
                    </div>

                    <div className="rounded-lg bg-zinc-800 p-3">
                        <p className="text-zinc-400">Result</p>
                        <p className="text-yellow-400 font-semibold">Processing</p>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 mb-8">
                    You can leave now or wait for detailed feedback.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onGoDashboard}
                        className="px-4 py-2 rounded-lg bg-white text-black font-medium"
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={onReload}
                        className="px-4 py-2 rounded-lg border border-zinc-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}