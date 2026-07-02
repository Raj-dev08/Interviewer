"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Bot,
    Send,
    X,
    Minus,
    Loader2,
    GripHorizontal,
} from "lucide-react";

import { useDSAChatStore } from "@/store/useDSAChatStore";

type Props = {
    interviewId: string;
    questionId: string;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const MIN_WIDTH = 340;
const MIN_HEIGHT = 420;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 540;

type OptimisticMsg = {
    id: string;
    text: string;
};

export default function FloatingChatWidget({
    interviewId,
    questionId,
    open,
    setOpen,
}: Props) {
    const {
        messages,
        loading,
        sending,
        getMessages,
        sendMessage,
        clearMessages,
        subscribetoMessages,
    } = useDSAChatStore();

    const [collapsed, setCollapsed] = useState(false);
    const [unread, setUnread] = useState(0);
    const [input, setInput] = useState("");
    const [optimistic, setOptimistic] = useState<OptimisticMsg[]>([]);
    const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

    const panelRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const lastCount = useRef(0);


    // Load history + subscribe on mount — interview is guaranteed started by parent
    useEffect(() => {
        if (!interviewId || !questionId) return;

        let cancelled = false;

        (async () => {
            clearMessages();
            await getMessages(interviewId, questionId);
        })();

        subscribetoMessages();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId, questionId]);


    // Drop optimistic bubbles once the real message lands
    useEffect(() => {
        if (optimistic.length === 0) return;
        setOptimistic((prev) =>
            prev.filter(
                (o) => !messages.some((m) => m.sentBy === "user" && m.message === o.text)
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    // Unread badge while collapsed
    useEffect(() => {
        if (messages.length > lastCount.current && collapsed) {
            setUnread((u) => u + (messages.length - lastCount.current));
        }
        lastCount.current = messages.length;
    }, [messages, collapsed]);

    useEffect(() => {
        if (!collapsed) setUnread(0);
    }, [collapsed]);

    // Autoscroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, optimistic, sending]);

    useEffect(() => {
        const id = setTimeout(() => {
            endRef.current?.scrollIntoView({
                behavior: "auto",
                block: "end",
            });
        }, 0);

        return () => clearTimeout(id);
    }, []);

    if (!open) return null;

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        setOptimistic((prev) => [...prev, { id: `${Date.now()}`, text }]);
        await sendMessage(interviewId, questionId, text);
    };

    // ---------- drag (header) ----------
    const onHeaderPointerDown = (e: React.MouseEvent) => {
        if (!panelRef.current) return;
        const rect = panelRef.current.getBoundingClientRect();
        const startPos = pos ?? { x: rect.left, y: rect.top };
        const startMouse = { x: e.clientX, y: e.clientY };

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startMouse.x;
            const dy = ev.clientY - startMouse.y;
            const maxX = window.innerWidth - (panelRef.current?.offsetWidth ?? size.width) - 8;
            const maxY = window.innerHeight - (panelRef.current?.offsetHeight ?? size.height) - 8;
            setPos({
                x: Math.min(Math.max(8, startPos.x + dx), Math.max(8, maxX)),
                y: Math.min(Math.max(8, startPos.y + dy), Math.max(8, maxY)),
            });
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    // ---------- resize (corner) ----------
    const onResizePointerDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const startMouse = { x: e.clientX, y: e.clientY };
        const startSize = { ...size };

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startMouse.x;
            const dy = ev.clientY - startMouse.y;
            setSize({
                width: Math.min(Math.max(MIN_WIDTH, startSize.width + dx), window.innerWidth * 0.92),
                height: Math.min(Math.max(MIN_HEIGHT, startSize.height + dy), window.innerHeight * 0.85),
            });
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const isBusy = loading && messages.length === 0;

    const panelStyle: React.CSSProperties = pos
        ? { position: "fixed", left: pos.x, top: pos.y, width: size.width, height: size.height }
        : { position: "fixed", right: 24, bottom: 24, width: size.width, height: size.height };

    return (
        <AnimatePresence mode="wait">
            {collapsed ? (
                <motion.button
                    key="bubble"
                    onClick={() => setCollapsed(false)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center hover:border-blue-500/50 transition"
                >
                    <span className="relative flex items-center justify-center">
                        <span className="absolute h-9 w-9 rounded-full bg-blue-500/20 animate-ping" />
                        <Bot className="h-6 w-6 text-blue-400 relative" />
                    </span>
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-[11px] font-semibold flex items-center justify-center text-white">
                            {unread}
                        </span>
                    )}
                </motion.button>
            ) : (
                <motion.div
                    key="panel"
                    ref={panelRef}
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.15 }}
                    style={panelStyle}
                    className="z-50 flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
                >
                    {/* HEADER — drag handle */}
                    <div
                        onMouseDown={onHeaderPointerDown}
                        className="shrink-0 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3 cursor-move select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                                <span className="absolute h-8 w-8 rounded-full bg-blue-500/20 animate-ping" />
                                <Bot className="h-4 w-4 text-blue-400 relative" />
                            </span>
                            <div className="min-w-0">
                                <h1 className="text-sm font-medium truncate">AI Interviewer</h1>
                                <p className="text-[11px] text-zinc-500 truncate">
                                    {sending ? "Thinking…" : "AI can make mistakes, verify important info"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setCollapsed(true)}
                                className="p-1.5 rounded-lg hover:bg-zinc-800 transition"
                                aria-label="Minimize"
                            >
                                <Minus className="h-4 w-4 text-zinc-400" />
                            </button>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
                        {isBusy ? (
                            <div className="space-y-3">
                                <div className="h-4 w-2/3 rounded bg-zinc-900 animate-pulse" />
                                <div className="h-4 w-1/2 rounded bg-zinc-900 animate-pulse" />
                                <div className="h-4 w-3/4 rounded bg-zinc-900 animate-pulse" />
                            </div>
                        ) : (
                            <>
                                {messages.map((m) => (
                                    <div
                                        key={m._id}
                                        className={`flex ${m.sentBy === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            key={m._id}
                                            className={`flex ${m.sentBy == "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.sentBy == "user"
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
                                                    {m.message}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {optimistic.map((o) => (
                                    <div key={o.id} className="flex justify-end">
                                        <div className="max-w-[82%] rounded-2xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm leading-relaxed text-zinc-300">
                                            {o.text}
                                        </div>
                                    </div>
                                ))}

                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* INPUT */}
                    <form
                        onSubmit={handleSend}
                        className="shrink-0 flex items-center gap-2 border-t border-zinc-800 p-3"
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message…"
                            disabled={isBusy}
                            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-blue-500/50 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={sending || isBusy || !input.trim()}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
                            aria-label="Send"
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </form>

                    {/* RESIZE HANDLE */}
                    <div
                        onMouseDown={onResizePointerDown}
                        className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize flex items-end justify-end p-1 text-zinc-700 hover:text-zinc-500"
                    >
                        <GripHorizontal className="h-3 w-3 rotate-45 text-green-400" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}