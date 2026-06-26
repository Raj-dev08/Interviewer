import CaseStudyInterview from "./CaseStudyInterview";
import {
    Clock,
    Lightbulb,
    ArrowRight,
    Target,
    Briefcase,
    Database,
    ClipboardList,
    Info,
} from "lucide-react";

type Props = {
    interviewId: string;
    question: any;
};

export default function CaseStudySection({
    interviewId,
    question,
}: Props) {
    return (
        <div className="min-h-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">

            {/* LEFT */}

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div className="mx-auto max-w-5xl space-y-6">

                    {/* HEADER */}

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-green-500/10 px-4 py-1 text-sm text-green-400">
                                Case Study
                            </span>

                            <span className="rounded-full bg-zinc-800 px-4 py-1 text-sm">
                                {question?.difficulty}
                            </span>

                            <span className="rounded-full bg-zinc-800 px-4 py-1 text-sm">
                                {question?.domain}
                            </span>

                            <span className="rounded-full bg-zinc-800 px-4 py-1 text-sm">
                                {question?.type}
                            </span>

                            <span className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-1 text-sm">
                                <Clock size={14} />
                                {question?.duration} mins
                            </span>
                        </div>

                        <h1 className="mt-6 text-4xl font-bold">
                            {question?.title}
                        </h1>

                        <p className="mt-6 text-lg leading-8 text-zinc-300">
                            {question?.description}
                        </p>
                    </div>

                    {/* CONTEXT */}

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <Info className="h-5 w-5 text-blue-400" />
                            <h2 className="text-xl font-semibold">
                                Background
                            </h2>
                        </div>

                        <div className="rounded-2xl bg-zinc-950 p-5 whitespace-pre-wrap leading-7 text-zinc-300">
                            {question?.previousContext}
                        </div>
                    </div>

                    {/* GOAL */}

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <Target className="h-5 w-5 text-green-400" />
                            <h2 className="text-xl font-semibold">
                                Goal
                            </h2>
                        </div>

                        <div className="rounded-2xl bg-zinc-950 p-5 whitespace-pre-wrap leading-7 text-zinc-300">
                            {question?.goal}
                        </div>
                    </div>

                    {/* DATA */}

                    {question?.data?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <Database className="h-5 w-5 text-cyan-400" />
                                <h2 className="text-xl font-semibold">
                                    Available Data
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {question.data.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                                    >
                                        <div className="font-medium">
                                            {item.label}
                                        </div>

                                        <div className="mt-2 text-zinc-300 whitespace-pre-wrap">
                                            {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* CONSTRAINTS */}

                    {question?.constraints?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <Briefcase className="h-5 w-5 text-orange-400" />
                                <h2 className="text-xl font-semibold">
                                    Constraints
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {question.constraints.map(
                                    (item: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300"
                                        >
                                            {item}
                                        </div>
                                    )
                                )}
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

                    {question?.followUps?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                            <h2 className="mb-5 text-xl font-semibold">
                                Follow Up Questions
                            </h2>

                            <div className="space-y-3">
                                {question.followUps.map(
                                    (item: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                                        >
                                            <ArrowRight
                                                size={18}
                                                className="mt-1 shrink-0 text-green-400"
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

            {/* RIGHT */}

            <div className="w-full md:w-[500px] min-h-[60vh] md:h-[calc(100vh-200px)] shrink-0 border-l border-zinc-800 bg-zinc-900">
                <CaseStudyInterview
                    interviewId={interviewId}
                    question={question}
                />
            </div>
        </div>
    );
}