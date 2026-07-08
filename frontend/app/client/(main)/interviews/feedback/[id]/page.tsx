"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useInterviewStore } from "@/store/useInterview";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Award,
    BarChart3,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Code2,
    Gauge,
    Sparkles,
    Loader2,
    BookOpen,
    Layers3,
    Lightbulb,
    ListChecks,
} from "lucide-react";

type TabId = "overview" | "dsa" | "sysdes" | "case";

const roundTitles: Record<string, string> = {
    case: "Case Study",
    "dsa-only": "DSA",
    system_design: "System Design",
    mixed: "Mixed Interview",
};

const categoryLabels: Record<string, string> = {
    problemSolving: "Problem Solving",
    communication: "Communication",
    speed: "Speed",
    codeQuality: "Code Quality",
    correctness: "Correctness",
};

export default function FeedbackPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
        overview: null,
        dsa: null,
        sysdes: null,
        case: null,
    });

    const {
        loading: feedbackLoading,
        dsaFeedback,
        caseFeedback,
        sysdesFeedback,
        submissions,
        getDSAFeedback,
        getCaseFeedback,
        getSysdesFeedback,
        getSubmissions,
        clearFeedback,
    } = useFeedbackStore();

    const {
        interview,
        getInterview,
        loading: interviewLoading,
        clearInterview,
    } = useInterviewStore();

    useEffect(() => {
        if (!id) return;
        const interviewId = id as string;
        Promise.allSettled([
            getDSAFeedback(interviewId),
            getCaseFeedback(interviewId),
            getSysdesFeedback(interviewId),
            getSubmissions(interviewId),
            getInterview(interviewId),
        ]);
        return () => {
            clearFeedback();
            clearInterview();
        };
    }, [id]);

    const loading = feedbackLoading || interviewLoading;
    const hasNoData = dsaFeedback.length === 0 && !caseFeedback && !sysdesFeedback;
    const roundLabel = interview ? roundTitles[interview.type] || interview.type : "";
    const totalQuestions = interview?.questions?.dsa?.length + interview?.questions?.sysDes?.length + interview?.questions?.case?.length


    const tabs: { id: TabId; label: string; icon: typeof Code2 }[] = [
        { id: "overview", label: "Overview", icon: Sparkles },
        ...(dsaFeedback.length > 0 ? [{ id: "dsa" as TabId, label: `Coding (${dsaFeedback.length})`, icon: Code2 }] : []),
        ...(sysdesFeedback ? [{ id: "sysdes" as TabId, label: "System Design", icon: Layers3 }] : []),
        ...(caseFeedback ? [{ id: "case" as TabId, label: "Case Study", icon: BookOpen }] : []),
    ];

    const focusRing =
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

    const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
        let nextIndex: number | null = null;
        if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") nextIndex = 0;
        if (e.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex !== null) {
            e.preventDefault();
            const nextTab = tabs[nextIndex];
            setActiveTab(nextTab.id);
            tabRefs.current[nextTab.id]?.focus();
        }
    };

    if (loading) {
        return (
            <div
                className="flex min-h-screen items-center justify-center gap-3 bg-zinc-950 text-white"
                role="status"
                aria-live="polite"
            >
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                <span className="text-zinc-300">Loading feedback…</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="mx-auto max-w-5xl">
                <Link href="/client/interviews">
                    <Button variant="ghost" className={`mb-8 text-zinc-300 hover:text-white ${focusRing}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                        Back
                    </Button>
                </Link>

                <div className="mb-6 flex items-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">
                    <div className="rounded-2xl bg-white p-4 text-black">
                        <Award size={28} aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Interview Feedback</h1>
                        {interview && (
                            <p className="mt-1 text-zinc-300">
                                {roundLabel} round · {interview.duration} mins
                                {totalQuestions !== null && (
                                    <> · {totalQuestions} question{totalQuestions === 1 ? "" : "s"}</>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {hasNoData ? (
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 text-center space-y-3">
                        <AlertCircle className="mx-auto h-8 w-8 text-zinc-500" aria-hidden="true" />
                        <h2 className="text-lg font-semibold">No feedback yet</h2>
                        <p className="text-sm text-zinc-300">
                            This interview doesn't have any evaluated feedback. Make sure the session was completed
                            before checking back here.
                        </p>
                        <Link href="/client/interviews" className="inline-block pt-2">
                            <Button className={`rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold px-6 ${focusRing}`}>
                                Back to interviews
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div
                            role="tablist"
                            aria-label="Feedback sections"
                            className="flex gap-6 overflow-x-auto border-b border-zinc-800"
                        >
                            {tabs.map((tab, index) => {
                                const Icon = tab.icon;
                                const selected = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        ref={(el) => {
                                            tabRefs.current[tab.id] = el;
                                        }}
                                        role="tab"
                                        id={`tab-${tab.id}`}
                                        aria-selected={selected}
                                        aria-controls={`panel-${tab.id}`}
                                        tabIndex={selected ? 0 : -1}
                                        onClick={() => setActiveTab(tab.id)}
                                        onKeyDown={(e) => handleTabKeyDown(e, index)}
                                        className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${focusRing} ${selected ? "border-white text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* OVERVIEW */}
                        {activeTab === "overview" && (
                            <div
                                id="panel-overview"
                                role="tabpanel"
                                aria-labelledby="tab-overview"
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-zinc-800 p-5">
                                        <div className="mb-2 flex items-center justify-between text-zinc-300">
                                            <span className="text-sm">Coding Questions</span>
                                            <Code2 className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums">{dsaFeedback.length}</div>
                                    </div>

                                    <div className="rounded-2xl border border-zinc-800 p-5">
                                        <div className="mb-2 flex items-center justify-between text-zinc-300">
                                            <span className="text-sm">Submissions</span>
                                            <BarChart3 className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums">{submissions.length}</div>
                                    </div>

                                    <div className="rounded-2xl border border-zinc-800 p-5">
                                        <div className="mb-2 flex items-center justify-between text-zinc-300">
                                            <span className="text-sm">Total Questions</span>
                                            <ListChecks className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                        <div className="text-2xl font-bold tabular-nums">{totalQuestions}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {dsaFeedback.length > 0 && (
                                        <SectionLink
                                            title="Coding Questions"
                                            icon={Code2}
                                            description={`${dsaFeedback.length} question${dsaFeedback.length > 1 ? "s" : ""} evaluated.`}
                                            onClick={() => setActiveTab("dsa")}
                                            focusRing={focusRing}
                                        />
                                    )}
                                    {sysdesFeedback && (
                                        <SectionLink
                                            title="System Design"
                                            icon={Layers3}
                                            description={`${sysdesFeedback.strength.length} strengths, ${sysdesFeedback.weakness.length} areas to improve, ${sysdesFeedback.improvement.length} suggestions.`}
                                            onClick={() => setActiveTab("sysdes")}
                                            focusRing={focusRing}
                                        />
                                    )}
                                    {caseFeedback && (
                                        <SectionLink
                                            title="Case Study"
                                            icon={BookOpen}
                                            description="Full breakdown of strengths, gaps, and suggestions."
                                            onClick={() => setActiveTab("case")}
                                            focusRing={focusRing}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* DSA DETAIL */}
                        {activeTab === "dsa" && (
                            <div
                                id="panel-dsa"
                                role="tabpanel"
                                aria-labelledby="tab-dsa"
                                className="space-y-6"
                            >
                                {dsaFeedback.map((feedback, index) => {
                                    const submission = submissions.find((s) => s.questionId === feedback.questionId);

                                    return (
                                        <div
                                            key={feedback._id}
                                            className="grid grid-cols-1 gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 lg:grid-cols-3"
                                        >
                                            <div className="space-y-6 lg:col-span-2">
                                                <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-black"
                                                            aria-hidden="true"
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <h3 className="font-semibold">Question {index + 1}</h3>
                                                    </div>
                                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200">
                                                        {feedback.verdict || "Pending"}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-sm font-medium text-zinc-300">Summary</span>
                                                    <p className="text-sm leading-relaxed text-zinc-200">{feedback.summary}</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <span className="text-sm font-medium text-zinc-300">Score breakdown</span>
                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                        {Object.entries(feedback.scores).map(([key, val]) => {
                                                            const label = categoryLabels[key] || key;
                                                            const percent = (Number(val) / 10) * 100;

                                                            return (
                                                                <div key={key} className="space-y-1.5 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-zinc-300">{label}</span>
                                                                        <span className="font-semibold tabular-nums">{val}/10</span>
                                                                    </div>
                                                                    <div
                                                                        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
                                                                        role="progressbar"
                                                                        aria-label={label}
                                                                        aria-valuenow={Number(val)}
                                                                        aria-valuemin={0}
                                                                        aria-valuemax={10}
                                                                    >
                                                                        <div
                                                                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                                                            style={{ width: `${percent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between gap-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium text-zinc-300">Submission details</h4>

                                                    {submission ? (
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-zinc-300">Result</span>
                                                                <span
                                                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${submission.isCorrect
                                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                                        : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                                                                        }`}
                                                                >
                                                                    {submission.isCorrect ? (
                                                                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                                                    ) : (
                                                                        <XCircle className="h-3 w-3" aria-hidden="true" />
                                                                    )}
                                                                    {submission.isCorrect ? "Correct" : "Incorrect"}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-300">Language</span>
                                                                <span className="capitalize">{submission.language || "—"}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-300">Difficulty</span>
                                                                <span className="capitalize">{submission.difficulty}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-300">Attempts</span>
                                                                <span className="tabular-nums">{submission.attemptNumber}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-300">Points</span>
                                                                <span className="font-semibold tabular-nums">{submission.totalPoint}</span>
                                                            </div>
                                                            {submission.percentageBeaten !== undefined && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-zinc-300">Outperformed</span>
                                                                    <span className="font-semibold tabular-nums text-emerald-300">
                                                                        {submission.percentageBeaten}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="py-6 text-center text-sm italic text-zinc-400">
                                                            No submission recorded for this question yet.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* SYSTEM DESIGN */}
                        {activeTab === "sysdes" && sysdesFeedback && (
                            <div
                                id="panel-sysdes"
                                role="tabpanel"
                                aria-labelledby="tab-sysdes"
                                className="grid grid-cols-1 gap-6 md:grid-cols-3"
                            >
                                <FeedbackColumn title="Strengths" items={sysdesFeedback.strength} icon={CheckCircle2} tone="emerald" />
                                <FeedbackColumn title="Areas to improve" items={sysdesFeedback.weakness} icon={AlertCircle} tone="rose" />
                                <FeedbackColumn title="Suggestions" items={sysdesFeedback.improvement} icon={Lightbulb} tone="indigo" />
                            </div>
                        )}

                        {/* CASE STUDY */}
                        {activeTab === "case" && caseFeedback && (
                            <div
                                id="panel-case"
                                role="tabpanel"
                                aria-labelledby="tab-case"
                                className="grid grid-cols-1 gap-6 md:grid-cols-3"
                            >
                                <FeedbackColumn title="Strengths" items={caseFeedback.strength} icon={CheckCircle2} tone="emerald" />
                                <FeedbackColumn title="Areas to improve" items={caseFeedback.weakness} icon={AlertCircle} tone="rose" />
                                <FeedbackColumn title="Suggestions" items={caseFeedback.improvement} icon={Lightbulb} tone="indigo" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionLink({
    title,
    description,
    icon: Icon,
    onClick,
    focusRing,
}: {
    title: string;
    description: string;
    icon: typeof Code2;
    onClick: () => void;
    focusRing: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-800 p-5 text-left transition-colors hover:border-zinc-700 md:flex-row md:items-center ${focusRing}`}
        >
            <div>
                <div className="mb-1 flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4 text-zinc-300" aria-hidden="true" />
                    {title}
                </div>
                <p className="max-w-2xl text-sm text-zinc-300">{description}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200">
                View details
            </span>
        </button>
    );
}

function FeedbackColumn({
    title,
    items,
    icon: Icon,
    tone,
}: {
    title: string;
    items: string[];
    icon: typeof CheckCircle2;
    tone: "emerald" | "rose" | "indigo";
}) {
    const toneText = { emerald: "text-emerald-400", rose: "text-rose-400", indigo: "text-indigo-300" }[tone];

    return (
        <div className="rounded-2xl border border-zinc-800 p-5">
            <h3 className="mb-4 border-b border-zinc-800 pb-3 font-semibold">{title}</h3>
            <ul className="space-y-3">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-200">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${toneText}`} aria-hidden="true" />
                        <span>{item}</span>
                    </li>
                ))}
                {items.length === 0 && <li className="text-sm italic text-zinc-400">Nothing recorded here yet.</li>}
            </ul>
        </div>
    );
}