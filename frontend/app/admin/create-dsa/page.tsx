"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ArrowLeft, Trash2, Cross, X, ChevronDown, ChevronUp } from "lucide-react";
import { useDsaStore } from "@/store/useDSA";
import CodeEditor from "@/components/CodeEditorPanel";
import { LANGUAGES } from "@/constants/lang";
import { Button } from "@/components/ui/button";
import { Editor } from "@monaco-editor/react";

export default function AdminCreateDSAPage() {
  const router = useRouter();
  const { createQuestion, loading } = useDsaStore();

  const [openLangs, setOpenLangs] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    difficulty: "easy",
    duration: 30,

    topics: [],
    topicInput: "",

    companyTags: [],
    companyInput: "",

    isPremium: false,

    example: [{ input: "", output: "", explanation: "" }],
    testCases: [{ input: "", output: "", isHidden: false }],

    availableLanguages: [],
    langInput: "",

    codeInAllLangs: [
      {
        lang: "cpp",
        starterCode: "",
        solutionCode: ""
      }
    ],

    maxMemory: 256,
    maxTime: 2000,

    constraints: [""],
    hints: [""],
    followUp: [""],

    correctAnswer: {
      language: "",
      code: "",
    },

    validationType: "exact",
    validationCode: {
      language: "",
      code: "",
    },
  });

  // ---------------- HELPERS ----------------

  const addTopic = () => {
    if (!form.topicInput.trim()) return;
    setForm({
      ...form,
      topics: [...form.topics, form.topicInput],
      topicInput: "",
    });
  };

  const addTestCase = () => {
    setForm({
      ...form,
      testCases: [...form.testCases, { input: "", output: "", isHidden: false }],
    });
  }

  const addLanguage = () => {
    if (!form.langInput.trim()) return;

    const lang = form.langInput.trim();

    if (form.availableLanguages.includes(lang)) return;
    if (!LANGUAGES.find((l) => l.value === lang)) return;

    setForm({
      ...form,
      availableLanguages: [...form.availableLanguages, lang],
      codeInAllLangs: [
        ...form.codeInAllLangs,
        {
          lang,
          starterCode: "",
          solutionCode: "",
        },
      ],
      langInput: "",
    });

    setOpenLangs((prev) => ({
      ...prev,
      [lang]: false, // collapsed by default
    }));
  };

  const addExample = () => {
    setForm({
      ...form,
      example: [
        ...form.example,
        { input: "", output: "", explanation: "" }
      ]
    });
  };

  const handleSubmit = async () => {
    if (!form.correctAnswer.language) {
      alert("Select correct answer language");
      return;
    }

    const validLang = LANGUAGES.find(
      (l) => l.value === form.correctAnswer.language
    );

    if (!validLang) {
      alert("Invalid language selected");
      return;
    }

    const success = await createQuestion(form);

    if (success) router.back();
  };

  const removeLanguage = (lang: string) => {
    setForm({
      ...form,
      availableLanguages: form.availableLanguages.filter((l: string) => l !== lang),
      codeInAllLangs: form.codeInAllLangs.filter((c: { lang: string }) => c.lang !== lang),
    });

    setOpenLangs((prev) => {
      const copy = { ...prev };
      delete copy[lang];
      return copy;
    });
  };

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800 transition"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-bold">
                Create DSA Question
              </h1>
              <p className="text-sm text-zinc-400">
                Admin builder for coding problems
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-black font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Create
          </button>
        </div>

        {/* FORM CARD */}
        <div className="flex flex-col gap-6">

          {/* BASIC INFO CARD */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
            />

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full min-h-[140px] rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
            />

            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value })
              }
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

          </div>

          {/* TOPICS + LANGUAGES CARD */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-6">

            {/* TOPICS */}
            <div>
              <div className="flex gap-2">
                <input
                  placeholder="Add topic"
                  value={form.topicInput}
                  onChange={(e) =>
                    setForm({ ...form, topicInput: e.target.value })
                  }
                  className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
                />
                <button
                  onClick={addTopic}
                  className="rounded-2xl bg-white px-4 text-black font-medium"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-2 flex-wrap mt-3">
                {form.topics.map((t: string, i: number) => (
                  <span key={i} className="bg-zinc-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-red-400 transition"
                    onClick={() => {
                      setForm({
                        ...form,
                        topics: form.topics.filter((topic: string) => topic !== t)
                      })
                    }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* LANGUAGES */}
            <div>
              <div className="flex gap-2">
                <select
                  value={form.langInput}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      langInput: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                >
                  {/* placeholder option */}
                  <option value="" disabled>
                    Select language
                  </option>

                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                {/* <input
                placeholder="Language (cpp, python)"
                value={form.langInput}
                onChange={(e) =>
                setForm({ ...form, langInput: e.target.value })
                }
                className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
            /> */}
                <button
                  onClick={addLanguage}
                  className="rounded-2xl bg-white px-4 text-black font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            <details className="rounded-2xl border border-zinc-600 bg-blue-950/20">
              <summary className="cursor-pointer px-5 py-4 font-semibold">
                📖 Starter Code Guide
              </summary>

              <div className="space-y-5 border-t border-zinc-600 p-5 text-sm text-zinc-300">

                <p>
                  The starter code is shown to candidates. They only write the
                  implementation inside the placeholder.
                </p>

                <div className="rounded-xl bg-zinc-950 p-4 font-mono text-xs whitespace-pre-wrap">
                  <Editor
                    theme="vs-dark"
                    height="100px"
                    language={"python"}
                    value={`class Solution:
  def twoSum(self, nums, target):
      # USER_CODE_HERE
      pass`}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>


                <div className="rounded-xl bg-yellow-950/20 p-4">

                  <h4 className="font-semibold text-yellow-400">
                    What candidates see
                  </h4>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-300">
                    <li>Only this file</li>
                    <li>No runner code</li>
                    <li>No hidden tests</li>
                    <li>No validation code</li>
                  </ul>

                </div>

              </div>

            </details>

            <details className="rounded-2xl border border-zinc-600 bg-blue-950/20">
              <summary className="cursor-pointer px-5 py-4 font-semibold">
                ⚙ Runner Code Guide
              </summary>

              <div className="space-y-5 border-t border-emerald-900 p-5">

                <p className="text-sm text-zinc-300">
                  The runner wraps the candidate's code and executes every
                  test case.
                </p>

                <div className="rounded-xl bg-zinc-950 p-4 font-mono text-xs whitespace-pre-wrap">
                  <Editor
                    theme="vs-dark"
                    height="200px"
                    language={"python"}
                    value={`class Solution:
  def twoSum(...):
      # USER_CODE_HERE

  ...

  res = sol.twoSum(nums,target)
  print(json.dumps(res))`}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>




                <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">

                  <p className="font-semibold">
                    Placeholder replacement
                  </p>

                  <div className="mt-3 grid md:grid-cols-2 gap-4">

                    <div>
                      <h4 className="mb-2 text-red-400">
                        Before
                      </h4>

                      <pre>{`# USER_CODE_HERE`}</pre>
                    </div>

                    <div>
                      <h4 className="mb-2 text-green-400">
                        After
                      </h4>

                      <pre>{`def twoSum(...):
              seen={}
              ...`}</pre>
                    </div>

                  </div>

                </div>

              </div>

            </details>

            <div className="flex flex-col gap-4">
              <h2 className="font-semibold">Code per Language</h2>

              {form.codeInAllLangs.map((c: any, i: number) => {
                const isOpen = openLangs[c.lang];

                return (
                  <div
                    key={i}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden"
                  >
                    {/* HEADER */}
                    <div
                      onClick={() =>
                        setOpenLangs((prev) => ({
                          ...prev,
                          [c.lang]: !prev[c.lang],
                        }))
                      }
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-300">{c.lang}</span>
                        <span className="text-xs text-zinc-500">
                          {isOpen ? "expanded" : "collapsed"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLanguage(c.lang);
                          }}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>

                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* BODY */}
                    {isOpen && (
                      <div className="p-4 flex flex-col gap-6">

                        {/* Starter */}
                        <div className="flex flex-col gap-2">
                          <div className="text-xs text-zinc-500">Starter Code</div>
                          <div className="h-[200px] border border-zinc-800 rounded-xl overflow-hidden">
                            <CodeEditor
                              value={c.starterCode}
                              language={c.lang}
                              onChange={(val) => {
                                const copy = [...form.codeInAllLangs];
                                copy[i].starterCode = val;
                                setForm({ ...form, codeInAllLangs: copy });
                              }}
                            />
                          </div>
                        </div>

                        {/* Solution */}
                        <div className="flex flex-col gap-2">
                          <div className="text-xs text-zinc-500">Solution Code</div>
                          <div className="h-[300px] border border-zinc-800 rounded-xl overflow-hidden">
                            <CodeEditor
                              value={c.solutionCode}
                              language={c.lang}
                              onChange={(val) => {
                                const copy = [...form.codeInAllLangs];
                                copy[i].solutionCode = val;
                                setForm({ ...form, codeInAllLangs: copy });
                              }}
                            />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>



          {/* EXAMPLES CARD */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Example</h2>

              <button
                onClick={addExample}
                className="px-3 py-1 rounded-xl bg-white text-black text-sm"
              >
                Add Example
              </button>
            </div>

            {form.example.map((ex: any, i: number) => (
              <div key={i} className="grid relative gap-2 md:grid-cols-2 bg-zinc-950 p-8 rounded-2xl border border-zinc-800"

              >
                <Button size="xs" className="absolute right-0 top-0 opacity-100 bg-red-500 transition rounded-tr-2xl cursor-pointer "
                  onClick={(e) => {
                    e.stopPropagation();
                    let copy = [...form.example];
                    copy = copy.filter((_, index) => index !== i);
                    setForm({ ...form, example: copy });
                  }}
                >
                  <Trash2 className="h-2 w-2" />
                </Button>
                <input
                  placeholder="Input"
                  value={ex.input}
                  onChange={(e) => {
                    const copy = [...form.example];
                    copy[i].input = e.target.value;
                    setForm({ ...form, example: copy });
                  }}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />

                <input
                  placeholder="Output"
                  value={ex.output}
                  onChange={(e) => {
                    const copy = [...form.example];
                    copy[i].output = e.target.value;
                    setForm({ ...form, example: copy });
                  }}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />

                <input
                  placeholder="Explanation (optional)"
                  value={ex.explanation}
                  onChange={(e) => {
                    const copy = [...form.example];
                    copy[i].explanation = e.target.value;
                    setForm({ ...form, example: copy });
                  }}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />
              </div>
            ))}
          </div>



          {/* META CONFIG */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-8">

            {/* ================= BASIC CONFIG ================= */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                Duration
              </h3>

              <div className="grid md:grid-cols-2 gap-4">

                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />

                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) =>
                      setForm({ ...form, isPremium: e.target.checked })
                    }
                  />
                  Premium Question
                </label>

              </div>
            </div>

            {/* ================= COMPANY TAGS ================= */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                COMPANY TAGS
              </h3>

              <input
                placeholder="Add company tag (e.g. Google, Amazon)"
                value={form.companyInput}
                onChange={(e) =>
                  setForm({ ...form, companyInput: e.target.value })
                }
                className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
              />

              <button
                onClick={() => {
                  if (!form.companyInput.trim()) return;
                  setForm({
                    ...form,
                    companyTags: [...form.companyTags, form.companyInput],
                    companyInput: "",
                  });
                }}
                className="w-fit px-3 py-1 bg-white text-black rounded-xl text-sm"
              >
                Add Company
              </button>

              <div className="flex gap-2 flex-wrap">
                {form.companyTags.map((c: string, i: number) => (
                  <span
                    key={i}
                    className="bg-zinc-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-red-400 transition"
                    onClick={() => {
                      setForm({
                        ...form,
                        companyTags: form.companyTags.filter(
                          (tag: string) => tag !== c
                        ),
                      });
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* ================= CONSTRAINTS ================= */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                CONSTRAINTS
              </h3>

              <textarea
                placeholder="One constraint per line"
                value={form.constraints.join("\n")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    constraints: e.target.value.split("\n"),
                  })
                }
                className="w-full min-h-[100px] rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
              />
            </div>

            {/* ================= HINTS ================= */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                HINTS
              </h3>

              <textarea
                placeholder="One hint per line"
                value={form.hints.join("\n")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hints: e.target.value.split("\n"),
                  })
                }
                className="w-full min-h-[100px] rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
              />
            </div>

            {/* ================= FOLLOW UP ================= */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                FOLLOW UP QUESTIONS
              </h3>

              <textarea
                placeholder="One follow-up per line"
                value={form.followUp.join("\n")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    followUp: e.target.value.split("\n"),
                  })
                }
                className="w-full min-h-[100px] rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
              />
            </div>

            {/* ================= PERFORMANCE LIMITS ================= */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                MEMORY LIMIT (KB)
              </h3>

              <div className="grid md:grid-cols-2 gap-4">

                <input
                  type="number"
                  placeholder="Max Memory (MB)"
                  value={form.maxMemory}
                  onChange={(e) =>
                    setForm({ ...form, maxMemory: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />

                <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
                  TIME LIMITS (MS)
                </h3>

                <input
                  type="number"
                  placeholder="Max Time (ms)"
                  value={form.maxTime}
                  onChange={(e) =>
                    setForm({ ...form, maxTime: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />

              </div>
            </div>

          </div>

          <details
            className="rounded-3xl border border-zinc-600 bg-zinc-600 overflow-hidden"
          >
            <summary className="cursor-pointer px-6 py-4 font-semibold text-cyan-300 hover:bg-cyan-950/20 transition">
              🧪 Test Case Guide
            </summary>

            <div className="border-t border-cyan-900 p-6 space-y-6">

              <div className="grid lg:grid-cols-2 gap-6">

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                  <h3 className="font-semibold mb-3">
                    Input Format
                  </h3>

                  <p className="text-sm text-zinc-400 mb-4">
                    Every test case input must be a valid JSON object.
                    The keys should exactly match the function parameters.
                  </p>

                  <pre className="rounded-xl bg-black p-4 text-sm overflow-auto">
                    {`{"nums": [2,7,11,15],"target": 9 }`}
                  </pre>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                  <h3 className="font-semibold mb-3">
                    Output Format
                  </h3>

                  <p className="text-sm text-zinc-400 mb-4">
                    The output should be exactly what the candidate's
                    function returns.
                  </p>

                  <pre className="rounded-xl bg-black p-4 text-sm overflow-auto">
                    {`[0,1]`}
                  </pre>
                </div>

              </div>

              <div className="rounded-2xl border border-green-900 bg-green-950/10 p-5">

                <h3 className="font-semibold text-green-400 mb-3">
                  Complete Example
                </h3>

                <div className="grid md:grid-cols-2 gap-6">

                  <div>

                    <p className="text-sm font-medium mb-2">
                      Input
                    </p>

                    <pre className="rounded-xl bg-black p-4 text-sm">
                      {`
{
  "nums": [2,7,11,15],
  "target": 9
}`}
                    </pre>

                  </div>

                  <div>

                    <p className="text-sm font-medium mb-2">
                      Expected Output
                    </p>

                    <pre className="rounded-xl bg-black p-4 text-sm">
                      {`[0,1]`}
                    </pre>

                  </div>

                </div>

              </div>

              <div className="rounded-2xl border border-yellow-900 bg-yellow-950/10 p-5">

                <h3 className="font-semibold text-yellow-400 mb-3">
                  Hidden Test Cases
                </h3>

                <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">

                  <li>
                    Visible test cases are shown to candidates.
                  </li>

                  <li>
                    Hidden test cases are only executed during judging.
                  </li>

                  <li>
                    Hidden cases should cover edge cases and performance.
                  </li>

                  <li>
                    Candidates never receive hidden inputs or outputs.
                  </li>

                </ul>

              </div>

              <div className="rounded-2xl border border-red-900 bg-red-950/10 p-5">

                <h3 className="font-semibold text-red-400 mb-3">
                  Common Mistakes
                </h3>

                <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">

                  <li>Input is not valid JSON.</li>

                  <li>Parameter names don't match the function signature.</li>

                  <li>Output format differs from the expected return type.</li>

                  <li>Extra spaces or invalid JSON formatting.</li>

                  <li>Using strings instead of arrays or objects.</li>

                </ul>

              </div>

            </div>

          </details>

          {/* TEST CASES CARD */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Test Cases</h2>



              <button
                onClick={addTestCase}
                className="px-3 py-1 rounded-xl bg-white text-black text-sm"
              >
                Add Test Case
              </button>
            </div>

            {form.testCases.map((tc: any, i: number) => (
              <div key={i} className="flex relative p-8 flex-col gap-2 bg-zinc-950 rounded-2xl border border-zinc-800">
                <Button size="xs" className="absolute right-0 top-0 opacity-100 bg-red-500 transition rounded-tr-2xl cursor-pointer "
                  onClick={(e) => {
                    e.stopPropagation();
                    let copy = [...form.example];
                    copy = copy.filter((_, index) => index !== i);
                    setForm({ ...form, example: copy });
                  }}
                >
                  <Trash2 className="h-2 w-2" />
                </Button>
                <h3 className="text-sm text-zinc-400 font-semibold">
                  Input {tc.isHidden && "(hidden)"}
                </h3>

                <input
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) => {
                    const copy = [...form.testCases];
                    copy[i].input = e.target.value;
                    setForm({ ...form, testCases: copy });
                  }}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />

                <h3 className="text-sm text-zinc-400 font-semibold">
                  Output
                </h3>
                <input
                  placeholder="Output"
                  value={tc.output}
                  onChange={(e) => {
                    const copy = [...form.testCases];
                    copy[i].output = e.target.value;
                    setForm({ ...form, testCases: copy });
                  }}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                />
                <div className="flex items-center justify-between gap-2 mt-3 text-sm text-zinc-300">
                  <h3 className="text-sm text-zinc-400 font-semibold">Hide this test case from candidates</h3>
                  <input
                    type="checkbox"
                    checked={tc.isHidden}
                    onChange={(e) => {
                      const copy = [...form.testCases];
                      copy[i].isHidden = e.target.checked;
                      setForm({ ...form, testCases: copy });
                    }}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ================= VALIDATION CONFIG ================= */}
          <div className={`rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4 ${form.validationType === "custom" ? "min-h-[400px]" : "min-h-[150px]"}`}>
            <h2 className="font-semibold">Validation Logic</h2>

            <select
              value={form.validationType}
              onChange={(e) =>
                setForm({
                  ...form,
                  validationType: e.target.value,
                })
              }
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
            >
              <option value="exact">Exact Match</option>
              <option value="custom">Custom Code Validation</option>
            </select>

            {/* only show editor if custom */}
            {form.validationType === "custom" && (
              <>
                <select
                  value={form.validationCode.language}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      validationCode: {
                        ...form.validationCode,
                        language: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
                >
                  <option value="">Select Language</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                <div className="flex-1 min-h-[250px]">
                  <CodeEditor
                    value={form.validationCode.code}
                    language={form.validationCode.language}
                    onChange={(val) =>
                      setForm({
                        ...form,
                        validationCode: {
                          ...form.validationCode,
                          code: val,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <details className="rounded-2xl border border-zinc-600 bg-zinc-950/20">
            <summary className="cursor-pointer px-5 py-4 font-semibold">
              ✅ Correct Answer Guide
            </summary>

            <div className="space-y-4 border-t border-purple-900 p-5">

              <p className="text-sm text-zinc-300">
                This solution is never shown to candidates. It is executed
                first to generate the expected outputs.
              </p>

              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">

                <ul className="space-y-2 text-sm">

                  <li>✓ Complete implementation</li>

                  <li>✓ No placeholders</li>

                  <li>✓ Same class/function signature as starter</li>

                  <li>✓ Must work with the runner</li>

                </ul>

              </div>

              <div className="rounded-xl bg-zinc-950 p-4 font-mono text-xs whitespace-pre-wrap">
                <Editor
                  theme="vs-dark"
                  height="200px"
                  language={"python"}
                  value={`import sys
import json

class Solution:
    def twoSum(self, nums, target):
        seen = {}

        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i


def run():
    raw = sys.stdin.read().strip()
    test_cases = json.loads(raw)

    sol = Solution()

    for item in test_cases:
        data = json.loads(item)

        nums = data["nums"]
        target = data["target"]

        res = sol.twoSum(nums, target)
        print(json.dumps(res))


if __name__ == "__main__":
    run()
`}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

          </details>

          {/* CODE EDITOR CARD (FIXED HEIGHT) */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4 min-h-[500px]">

            <h2 className="font-semibold">Correct Answer</h2>

            <select
              value={form.correctAnswer.language}
              onChange={(e) =>
                setForm({
                  ...form,
                  correctAnswer: {
                    ...form.correctAnswer,
                    language: e.target.value,
                  },
                })
              }
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
            >
              <option value="">Select Language</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            {/* THIS FIXES YOUR MAIN ISSUE */}
            <div className="flex-1 min-h-[350px]">
              <CodeEditor
                value={form.correctAnswer.code}
                language={form.correctAnswer.language}
                onChange={(val) =>
                  setForm({
                    ...form,
                    correctAnswer: {
                      ...form.correctAnswer,
                      code: val,
                    },
                  })
                }
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}