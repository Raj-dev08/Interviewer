"use client";

import Editor from "@monaco-editor/react";

export default function CodeEditor({
  value,
  language,
  onChange,
}: {
  value: string;
  language: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="h-full flex flex-col rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-lg">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2">

          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <div className="w-2 h-2 rounded-full bg-green-500" />

          <span className="ml-3 text-xs text-zinc-400">
            Code Editor
          </span>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">

          <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-300">
            {language || "javascript"}
          </span>

        </div>

      </div>

      {/* EDITOR */}
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="300px"
          language={language}
          value={value}
          onChange={(v) => onChange(v || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            lineNumbers: "on",
            minimap: { enabled: false },

            scrollBeyondLastLine: false,
            automaticLayout: true,

            // wordWrap: "on",

            padding: {
              top: 12,
              bottom: 12,
            },

            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              useShadows: true,
            },

            renderLineHighlight: "all",
            smoothScrolling: true,
            

            overviewRulerLanes: 2,
          }}
        />
      </div>

    </div>
  );
}