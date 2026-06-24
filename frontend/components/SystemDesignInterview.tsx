"use client";

import { useEffect, useRef, useState } from "react";
import {
    Send,
    Loader2,
    PlayCircle,
    Bot,
} from "lucide-react";

import { useSysDesStore } from "@/store/useSystemDesChatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SystemDesignInterview({
    interviewId,
    question,
}: {
    interviewId: string;
    question: any;
}) {
    const {
        messages,
        loading,
        sending,
        starting,
        getMessages,
        startInterview,
        sendMessage,
        getStartStatus,
        subscribetoMessages
    } = useSysDesStore();

    const [input, setInput] = useState("");
    const [started, setStarted] =
        useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {

        const init = async () => {
            const canStart = await getStartStatus(
                interviewId,
                question._id
            );
            if (!question?._id) return;
            if (!canStart) return

            if (canStart) {
                setStarted(true)
            }

            subscribetoMessages()

            getMessages(
                interviewId,
                question._id
            );
        }
        init()
    }, []);

    useEffect(() => {
        if (!scrollRef.current) return;

        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, loading]);

    useEffect(() => {
        if (messages.length > 0) {
            setStarted(true);
        }
    }, [messages]);

    const handleStart = async () => {
        setStarted(true)
        const success =
            await startInterview(
                interviewId,
                question._id
            );


        if (success) {
            setStarted(true);

            getMessages(
                interviewId,
                question._id
            );
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const text = input;

        setInput("");

        console.log("hitting", input)

        await sendMessage(
            interviewId,
            question._id,
            text
        );
    };

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5" />

                    <div>
                        <h2 className="font-semibold">
                            AI Interviewer
                        </h2>

                        <p className="text-xs text-zinc-500">
                            System Design Round
                        </p>
                    </div>
                </div>
            </div>
            {!started ? (
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="max-w-md text-center">

                        <PlayCircle className="mx-auto mb-6 h-16 w-16 text-green-400" />

                        <h2 className="text-2xl font-bold">
                            Ready to Begin?
                        </h2>

                        <p className="mt-3 text-zinc-400">
                            The AI interviewer will start
                            asking questions and evaluate
                            your system design approach.
                        </p>

                        <button
                            onClick={handleStart}
                            disabled={starting}
                            className="mt-8 rounded-xl bg-green-600 px-6 py-3 font-medium transition hover:bg-green-500"
                        >
                            {starting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Start Interview"
                            )}
                        </button>

                    </div>
                </div>
            ) : (
                <>
                    <div ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {loading ? (
                            <Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin" />
                        ) : (
                            messages.map((msg: any, idx: number) => {
                                const isUser = msg.sentBy === "user" || msg.role === "user";

                                return (
                                    <div
                                        key={idx}
                                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                                                ? "bg-blue-600 text-white"
                                                : "bg-zinc-800 text-zinc-100"
                                                }`}
                                        >
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => (
                                                        <p className="mb-2 last:mb-0">{children}</p>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul className="list-disc ml-5 space-y-1">
                                                            {children}
                                                        </ul>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li className="text-sm">{children}</li>
                                                    ),
                                                    code: ({ children }) => (
                                                        <code className="bg-black/40 px-1 py-0.5 rounded">
                                                            {children}
                                                        </code>
                                                    ),
                                                    strong: ({ children }) => (
                                                        <strong className="font-semibold text-white">
                                                            {children}
                                                        </strong>
                                                    ),
                                                }}
                                            >
                                                {msg.message}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="border-t border-zinc-800 p-4">
                        <div className="flex gap-2">

                            <input
                                value={input}
                                onChange={(e) =>
                                    setInput(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleSend()
                                }
                                placeholder="Explain your design..."
                                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 outline-none focus:border-zinc-500"
                            />

                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="rounded-xl bg-white px-4 text-black"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>

                        </div>
                    </div>
                </>
            )}
        </div>
    );
}