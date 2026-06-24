import SystemDesignInterview from "./SystemDesignInterview";
import {
    Clock,
    Layers,
    Lightbulb,
    ArrowRight,
} from "lucide-react";

type Props = {
    interviewId: string;
    question: any;
};

export default function SystemDesignSection({
    interviewId,
    question,
}: Props) {
    return (
        <div className="min-h-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
            {/* LEFT SIDE */}

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div className="mx-auto max-w-5xl space-y-6">

                    {/* HEADER */}

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-blue-500/10 px-4 py-1 text-sm text-blue-400">
                                System Design
                            </span>

                            {question?.difficulty && (
                                <span className="rounded-full bg-zinc-800 px-4 py-1 text-sm">
                                    {question.difficulty}
                                </span>
                            )}

                            {question?.duration && (
                                <span className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-1 text-sm">
                                    <Clock size={14} />
                                    {question.duration} mins
                                </span>
                            )}
                        </div>

                        <h1 className="mt-6 text-4xl font-bold leading-tight">
                            {question?.question}
                        </h1>

                        {question?.description && (
                            <p className="mt-6 text-lg leading-8 text-zinc-300">
                                {question.description}
                            </p>
                        )}
                    </div>

                    {/* CONSTRAINTS */}

                    {question?.constraints && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <Layers className="h-5 w-5 text-blue-400" />
                                <h2 className="text-xl font-semibold">
                                    Constraints
                                </h2>
                            </div>

                            <div className="rounded-2xl bg-zinc-950 p-5">
                                <p className="whitespace-pre-wrap leading-7 text-zinc-300">
                                    {question.constraints}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* HINTS */}

                    {question?.hints?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <Lightbulb className="h-5 w-5 text-yellow-400" />
                                <h2 className="text-xl font-semibold">
                                    Hints
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {question.hints.map(
                                    (hint: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300"
                                        >
                                            {hint}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* FOLLOW UPS */}

                    {question?.followUp?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                            <h2 className="mb-5 text-xl font-semibold">
                                Follow Up Questions
                            </h2>

                            <div className="space-y-3">
                                {question.followUp.map(
                                    (item: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                                        >
                                            <ArrowRight
                                                size={18}
                                                className="mt-1 shrink-0 text-blue-400"
                                            />

                                            <span className="text-zinc-300">
                                                {item}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT CHAT PANEL */}

            <div className="w-full md:w-[500px] min-h-[60vh] md:h-[calc(100vh-200px)] shrink-0 border-l border-zinc-800 bg-zinc-900">
                <SystemDesignInterview
                    interviewId={interviewId}
                    question={question}
                />
            </div>
        </div>
    );
}