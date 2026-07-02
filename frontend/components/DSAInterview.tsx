"use client";

import { useEffect, useState } from "react";
import { useDSAExecStore } from "@/store/useDSAExecStore";
import { useDSAChatStore } from "@/store/useDSAChatStore";
import FloatingChatWidget from "./DSAChatWidget";

import {
    Clock,
    Code2,
    Lightbulb,
    ArrowRight,
    Cpu,
    MemoryStick,
    CheckCircle2,
    XCircle,
    Bot,
    Sparkles,
} from "lucide-react";

import CodeEditor from "./CodeEditorPanel";
import { motion } from "framer-motion";

type Props = {
    interviewId: string;
    question: any;
};

// Safely parse a value that might be a JSON string, a JSON-ish object
// literal (e.g. `{ nums: [2,7,11,15], target: 9 }` without quoted keys),
// or just a plain primitive/string.
function safeParse(value: any): any {
    if (value == null) return value;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();

    try {
        return JSON.parse(trimmed);
    } catch {
        // fall through
    }

    // Try to coerce unquoted-key object literals into valid JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            const fixed = trimmed.replace(
                /([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g,
                '$1"$2":'
            );
            return JSON.parse(fixed);
        } catch {
            // fall through
        }
    }

    return value;
}

function formatPrimitive(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "—";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
}

// Renders a parsed value as labeled key/value fields when it's an object,
// or as a single labeled field when it's a primitive/array.
function ParsedFields({ value }: { value: any }) {
    const parsed = safeParse(value);

    if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
    ) {
        const entries = Object.entries(parsed);

        if (entries.length === 0) {
            return <div className="text-zinc-500 italic">empty</div>;
        }

        return (
            <div className="grid gap-2 sm:grid-cols-2">
                {entries.map(([key, val]) => (
                    <div
                        key={key}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2"
                    >
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
                            {key}
                        </div>
                        <div className="text-zinc-200 break-words">
                            {formatPrimitive(val)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-200 break-words">
            {formatPrimitive(parsed)}
        </div>
    );
}

export default function DSASection({
    interviewId,
    question,
}: Props) {
    const [language, setLanguage] = useState("");
    const [code, setCode] = useState("");

    const {
        runCode,
        running,
        runResult,
        clearResults,
    } = useDSAExecStore();
    const { getStartStatus, startInterview, starting } = useDSAChatStore()

    const [selectedCase, setSelectedCase] = useState(0);
    const [open, setOpen] = useState(false)
    const [dsaChatOpen, setDsaChatOpen] = useState(true)

    useEffect(() => {
        if (!question) return;

        const defaultLang = question.availableLanguages?.[0] || "";

        setLanguage(defaultLang);

        const starter =
            question.codeInAllLangs.find(
                (c: any) => c.lang === defaultLang
            )?.starterCode || "";

        setCode(starter);

        clearResults();
    }, [question]);

    useEffect(() => {
        const init = async () => {
            if (!question._id || !interviewId) return
            const canOpen = await getStartStatus(interviewId, question._id)
            if (!canOpen) return

            if (canOpen) {
                setOpen(true)
            }
        }
        init()
    }, [])


    if (!open) {
        return (
            <div className="h-full flex justify-center items-center">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold mb-6">
                        DSA Question Not Started
                    </h1>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm sm:text-base">
                        Please click the "Start Interview" before proceeding.
                    </p>
                    <button
                        onClick={async () => {
                            const success = await startInterview(interviewId, question._id)
                            if (success) setOpen(true)
                        }}
                        disabled={starting}
                        className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                    >
                        {starting ? "Starting..." : "Start Interview"}
                    </button>
                </div>
            </div>
        )
    }


    return (
        <div className="h-full no-scrollbar flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* LEFT PANEL */}
            <FloatingChatWidget
                interviewId={interviewId}
                questionId={question._id}
                open={dsaChatOpen}
                setOpen={setDsaChatOpen}
            />

            <div className="flex-1 lg:overflow-y-auto no-scrollbar border-b lg:border-b-0 lg:border-r border-zinc-800">
                <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
                    {/* HEADER */}

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="rounded-full bg-blue-500/10 text-blue-400 px-4 py-1 text-sm">
                                DSA
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

                            {question?.topics?.map((topic: string) => (
                                <span
                                    key={topic}
                                    className="rounded-full bg-zinc-800 px-3 py-1 text-xs"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>

                        <h1 className="mt-6 text-2xl sm:text-4xl font-bold">
                            {question?.title}
                        </h1>

                        <p className="mt-6 text-zinc-300 leading-7 sm:leading-8 whitespace-pre-wrap text-sm sm:text-base">
                            {question?.description}
                        </p>
                    </div>

                    {/* EXAMPLE */}

                    {question?.example?.map((ex: any, idx: number) => (
                        <div
                            key={ex._id || idx}
                            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <Code2 className="h-5 w-5 text-blue-400" />
                                <h2 className="text-lg sm:text-xl font-semibold">
                                    Example {question.example.length > 1 ? idx + 1 : ""}
                                </h2>
                            </div>

                            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 font-mono text-xs sm:text-sm space-y-4 overflow-x-auto">
                                <div>
                                    <div className="text-zinc-500 mb-1">Input</div>
                                    <div className="break-words">{ex.input}</div>
                                </div>

                                <div>
                                    <div className="text-zinc-500 mb-1">Output</div>
                                    <div className="break-words">{ex.output}</div>
                                </div>

                                {ex.explanation && (
                                    <div>
                                        <div className="text-zinc-500 mb-1">
                                            Explanation
                                        </div>
                                        <div className="font-sans text-zinc-300">
                                            {ex.explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* TEST CASES */}

                    {question?.testCases?.filter((tc: any) => !tc.isHidden)?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold mb-5">
                                Visible Test Cases
                            </h2>

                            <div className="space-y-4">
                                {question.testCases
                                    .filter((tc: any) => !tc.isHidden)
                                    .map((tc: any, index: number) => (
                                        <div
                                            key={tc._id || index}
                                            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5"
                                        >
                                            <div className="font-semibold mb-4">
                                                Case {index + 1}
                                            </div>

                                            <div className="space-y-4 text-xs sm:text-sm">
                                                <div>
                                                    <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                        Input
                                                    </div>

                                                    <ParsedFields value={tc.input} />
                                                </div>

                                                <div>
                                                    <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                        Expected Output
                                                    </div>

                                                    <ParsedFields value={tc.output} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* CONSTRAINTS */}

                    {question?.constraints && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold mb-5">
                                Constraints
                            </h2>

                            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 leading-7 text-zinc-300 text-sm">
                                {Array.isArray(question.constraints) ? (
                                    <ul className="list-disc list-inside space-y-1">
                                        {question.constraints.map((c: string, i: number) => (
                                            <li key={i} className="font-mono break-words">
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="whitespace-pre-wrap">
                                        {question.constraints}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LIMITS */}

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold mb-5">
                            Execution Limits
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 flex items-center gap-3">
                                <Cpu className="text-blue-400" />

                                <div>
                                    <div className="text-zinc-400 text-sm">
                                        Time Limit
                                    </div>

                                    <div>{question.maxTime} ms</div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 flex items-center gap-3">
                                <MemoryStick className="text-green-400" />

                                <div>
                                    <div className="text-zinc-400 text-sm">
                                        Memory Limit
                                    </div>

                                    <div>{question.maxMemory} MB</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HINTS */}

                    {question?.hints?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <Lightbulb className="text-yellow-400 h-5 w-5" />

                                <h2 className="text-lg sm:text-xl font-semibold">
                                    Hints
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {question.hints.map((hint: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300 text-sm"
                                    >
                                        {hint}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FOLLOW UPS */}

                    {question?.followUp?.length > 0 && (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold mb-5">
                                Follow Up
                            </h2>

                            <div className="space-y-3">
                                {question.followUp.map(
                                    (item: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex gap-3"
                                        >
                                            <ArrowRight
                                                size={18}
                                                className="text-blue-400 mt-1 shrink-0"
                                            />

                                            <span className="text-zinc-300 text-sm">
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

            {/* RIGHT PANEL */}

            <div className="w-full lg:w-[55%] flex flex-col bg-zinc-900 lg:overflow-y-scroll no-scrollbar min-h-[80vh] lg:min-h-0">
                {/* Toolbar */}

                <div className="border-b border-zinc-800 p-3 sm:p-4 flex items-center justify-between gap-3 sticky top-0 lg:static bg-zinc-900 z-10">
                    <select
                        value={language}
                        onChange={(e) => {
                            const lang = e.target.value;

                            setLanguage(lang);

                            const starter =
                                question.codeInAllLangs.find(
                                    (c: any) => c.lang === lang
                                )?.starterCode || "";

                            setCode(starter);

                            clearResults();
                        }}
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 sm:px-4 py-2 outline-none text-sm sm:text-base"
                    >
                        {question?.availableLanguages?.map((lang: string) => (
                            <option key={lang}>{lang}</option>
                        ))}
                    </select>

                    <div className="flex gap-3">
                        <button
                            onClick={() =>
                                runCode(
                                    interviewId,
                                    question._id,
                                    language,
                                    code
                                )
                            }
                            disabled={running}
                            className="rounded-xl bg-zinc-800 px-4 sm:px-5 py-2 hover:bg-zinc-700 transition text-sm sm:text-base disabled:opacity-60"
                        >
                            {running ? "Running..." : "Run"}
                        </button>
                    </div>
                </div>

                {/* EDITOR */}

                <div className="flex-1 p-3 sm:p-4 min-h-[40vh] lg:min-h-0">
                    <CodeEditor
                        value={code}
                        language={language}
                        onChange={setCode}
                    />
                </div>

                {/* RESULTS */}

                <div className="lg:h-64 border-t no-scrollbar border-zinc-800 bg-zinc-950 p-4 sm:p-5 lg:overflow-auto">
                    <div className="text-base sm:text-lg font-semibold mb-4">
                        Output
                    </div>

                    {!runResult ? (
                        <div className="text-zinc-500 text-sm">
                            Run the code to view results.
                        </div>
                    ) : runResult.status ? (
                        // Compile / runtime error from the judge itself
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm sm:text-base">
                                <XCircle size={18} />
                                {runResult.status.description}
                            </div>

                            {runResult.stderr && (
                                <pre className="text-red-300 whitespace-pre-wrap text-xs sm:text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-3 overflow-x-auto">
                                    {runResult.stderr}
                                </pre>
                            )}
                        </div>
                    ) : !runResult.passed ? (
                        <div className="space-y-4">
                            <div
                                className={`flex items-center gap-2 font-semibold text-sm sm:text-base rounded-xl p-4 border ${runResult.passed
                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}
                            >
                                {runResult.passed ? (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Accepted
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={20} />
                                        Wrong Answer
                                    </>
                                )}
                            </div>

                            {/* Case selector */}

                            <div className="flex flex-wrap gap-2">
                                {runResult.results.map((r: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedCase(i)}
                                        className={`px-3 py-2 rounded-lg border text-sm transition ${selectedCase === i
                                            ? r.passed
                                                ? "bg-green-500/15 border-green-500/30 text-green-300"
                                                : "bg-red-500/15 border-red-500/30 text-red-300"
                                            : "border-zinc-800 hover:bg-zinc-900"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {r.passed ? (
                                                <CheckCircle2 size={14} />
                                            ) : (
                                                <XCircle size={14} />
                                            )}
                                            Case {i + 1}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {runResult.results[selectedCase] && (
                                <div
                                    className={`rounded-xl border p-4 ${runResult.results[selectedCase].passed
                                        ? "border-green-500/20 bg-green-500/5"
                                        : "border-red-500/20 bg-red-500/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="font-semibold">
                                            Case {selectedCase + 1}
                                        </div>

                                        <span
                                            className={`flex items-center gap-1 text-xs font-medium ${runResult.results[selectedCase].passed
                                                ? "text-green-400"
                                                : "text-red-400"
                                                }`}
                                        >
                                            {runResult.results[selectedCase].passed ? (
                                                <>
                                                    <CheckCircle2 size={14} />
                                                    Passed
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={14} />
                                                    Failed
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                Input
                                            </div>
                                            <ParsedFields
                                                value={runResult.results[selectedCase].input}
                                            />
                                        </div>

                                        <div>
                                            <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                Expected Output
                                            </div>
                                            <ParsedFields
                                                value={runResult.results[selectedCase].expected}
                                            />
                                        </div>

                                        <div>
                                            <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                Your Output
                                            </div>
                                            <ParsedFields
                                                value={runResult.results[selectedCase].actual}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // All visible test cases passed: show every case in green
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-400 font-semibold text-sm sm:text-base bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <CheckCircle2 size={20} className="shrink-0" />
                                Accepted
                            </div>
                            <div className="flex gap-2 flex-wrap mb-4">
                                {runResult.results.map((r: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedCase(i)}
                                        className={`px-3 py-2 rounded-lg border ${selectedCase === i
                                            ? "bg-zinc-800 border-zinc-600"
                                            : "border-zinc-800 hover:bg-zinc-900"
                                            }`}
                                    >
                                        Case {i + 1}
                                    </button>
                                ))}
                            </div>

                            {runResult.results[selectedCase] && (
                                <div
                                    className="rounded-xl border border-green-500/20 p-4 bg-green-500/5"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-sm">
                                            Case {selectedCase + 1}
                                        </div>
                                        <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                                            <CheckCircle2 size={14} />
                                            Passed
                                        </span>
                                    </div>

                                    <div className="text-xs sm:text-sm space-y-1 font-mono overflow-x-auto">
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                    Input
                                                </div>
                                                <ParsedFields value={runResult.results[selectedCase].input} />
                                            </div>

                                            <div>
                                                <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                    Expected Output
                                                </div>
                                                <ParsedFields value={runResult.results[selectedCase].expected} />
                                            </div>

                                            <div>
                                                <div className="text-zinc-500 mb-2 uppercase tracking-wide text-[11px]">
                                                    Your Output
                                                </div>
                                                <ParsedFields value={runResult.results[selectedCase].actual} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {!dsaChatOpen && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDsaChatOpen(true)}
                    className="group fixed bottom-6 right-6 z-50"
                >
                    {/* Outer Glow */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/25 blur-2xl group-hover:bg-blue-500/40 transition-all duration-500 animate-pulse" />

                    {/* Rotating Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 10,
                            ease: "linear",
                        }}
                        className="absolute -inset-1 rounded-full border border-blue-500/30 border-dashed"
                    />

                    {/* Button */}
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-[0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-xl transition-all duration-300 group-hover:border-blue-500/60 group-hover:shadow-[0_0_45px_rgba(59,130,246,0.45)]">
                        <Bot className="h-7 w-7 text-blue-400 transition-transform duration-300 group-hover:scale-110" />

                        <Sparkles className="absolute right-2 top-2 h-3.5 w-3.5 text-blue-300 animate-pulse" />
                    </div>
                </motion.button>
            )}
        </div>
    );
}