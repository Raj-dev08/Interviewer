"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDsaStore } from "@/store/useDSA";
import { useAuthStore } from "@/store/useAuth";
import { Editor } from "@monaco-editor/react";
import {
  Loader2,
  ArrowLeft,
  Clock,
  Star,
  Trash,
  ChevronDown, ChevronRight, EyeOff, Eye,
  ArrowBigDown,
  ArrowDown,
  ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast/headless";

export default function AdminQuestionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [showTestCases, setShowTestCases] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCases, setNewCases] = useState([
    {
      input: "",
      output: "",
      isHidden: false
    }
  ]);


  const { user, checkAuth } = useAuthStore();
  const {
    question,
    loading,
    fetchAdminQuestion,
    deleteQuestion,
    clearQuestion,
    addTestCases
  } = useDsaStore();

  useEffect(() => {
    if (id) {
      fetchAdminQuestion(id as string);
      if (!user) checkAuth();
    }

    return () => clearQuestion();
  }, [id]);

  const [hideCodeOf, setHideCodeOf] = useState(() => {
    const initial: Record<string, boolean> = {};
    question?.codeInAllLangs?.forEach((code) => {
      initial[code.lang] = false;
    });
    return initial;
  });

  console.log(hideCodeOf)

  const validateCases = () => {
    for (const tc of newCases) {

      if (!tc.input.trim()) {
        toast.error("Input required");
        return false;
      }

      if (!tc.output.trim()) {
        toast.error("Output required");
        return false;
      }

      try {
        JSON.parse(tc.input);
      } catch {
        toast.error("Input must be valid JSON");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (q: any) => {

    if (!validateCases()) return;

    const ok = await addTestCases(
      q._id,
      newCases
    );

    if (ok) {
      setShowAddModal(false);

      setNewCases([
        {
          input: "",
          output: "",
          isHidden: false
        }
      ]);

      fetchAdminQuestion(q._id);
    }
  };

  if (loading && !question) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-10 text-zinc-400">
        Question not found
      </div>
    );
  }

  // console.log("Admin Question Page Rendered. Question data:", question);

  return (
    <div className="max-w-[1800px] mx-auto">

      <div className="flex items-center justify-between mb-6 mt-1 mx-2">

        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-zinc-200 backdrop-blur transition-all duration-200 hover:-translate-x-1 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>

        {question.addedBy._id === user?._id && (
          <Button
            variant="destructive"
            onClick={async () => {
              if (confirm("Delete this question permanently?")) {
                const ok = await deleteQuestion(question._id);

                if (ok) {
                  router.push("/admin/content");
                }
              }
            }}
            className="bg-red-500 text-white hover:bg-red-600 cursor-pointer"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">

        {/* LEFT PANEL */}
        <div className="lg:col-span-5">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">

            {/* HEADER */}
            <div className="border-b border-zinc-800 p-6">

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-3xl font-bold">
                  {question.title}
                </h1>

                <span
                  className={`px-3 py-1 rounded-full text-sm ${question.difficulty === "easy"
                    ? "bg-green-500/20 text-green-400"
                    : question.difficulty === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                    }`}
                >
                  {question.difficulty}
                </span>

                <span className="px-3 py-1 rounded-full bg-zinc-800 text-sm">
                  {question.duration} min
                </span>

                <span className="px-3 py-1 rounded-full bg-zinc-800 text-sm">
                  ⭐ {question.rating}
                </span>

              </div>
              <div className="my-1">
                <p className="text-xs">
                  Created by : {question.addedBy.name} &nbsp; |
                  &nbsp;
                  <a href={`https://mailto:${question.addedBy.email}`} target="blank" className="text-blue-500 cursor-pointer hover:text-blue-400">
                    {question.addedBy.email}
                  </a>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {question.topics.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-zinc-800 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>

            </div>

            {/* BODY */}
            <div className="p-6 space-y-8">

              <section>
                <h2 className="font-bold text-xl mb-3">
                  Description
                </h2>

                <div className="whitespace-pre-wrap text-zinc-300">
                  {question.description}
                </div>
              </section>

              <section>
                <h2 className="font-bold text-xl mb-4">
                  Examples
                </h2>

                <div className="space-y-4">
                  {question.example.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-zinc-950 border border-zinc-800 p-4"
                    >
                      <div className="font-semibold mb-3">
                        Example {i + 1}
                      </div>

                      <div className="space-y-3 text-sm">

                        <div>
                          <div className="text-zinc-400 mb-1">
                            Input
                          </div>

                          <pre className="bg-black rounded-lg p-3 overflow-x-auto">
                            {e.input}
                          </pre>
                        </div>

                        <div>
                          <div className="text-zinc-400 mb-1">
                            Output
                          </div>

                          <pre className="bg-black rounded-lg p-3 overflow-x-auto">
                            {e.output}
                          </pre>
                        </div>

                        {e.explanation && (
                          <div>
                            <div className="text-zinc-400 mb-1">
                              Explanation
                            </div>

                            <div>{e.explanation}</div>
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>

              </section>

              {!!question.constraints?.length && (
                <section>
                  <h2 className="font-bold text-xl mb-3">
                    Constraints
                  </h2>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-sm space-y-2">
                    {question.constraints.map((c, i) => (
                      <div key={i}>{c}</div>
                    ))}
                  </div>
                </section>
              )}

              {!!question.hints?.length && (
                <section>
                  <h2 className="font-bold text-xl mb-3">
                    Hints
                  </h2>

                  <div className="space-y-3">
                    {question.hints.map((h, i) => (
                      <details
                        key={i}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                      >
                        <summary className="cursor-pointer">
                          Hint {i + 1}
                        </summary>

                        <div className="mt-3 text-zinc-300">
                          {h}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {!!question.followUp?.length && (
                <section>
                  <h2 className="font-bold text-xl mb-3">
                    Follow Up
                  </h2>

                  <div className="space-y-2">
                    {question.followUp.map((f, i) => (
                      <div
                        key={i}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-7">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">

            {/* FAKE VS CODE HEADER */}
            <div className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center px-4">

              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>

              <div className="ml-4 text-sm text-zinc-400">
                Question Files
              </div>

            </div>

            <div className="p-6 space-y-6">

              {question.codeInAllLangs.map((code) => (
                <div
                  key={code.lang}
                  className="border border-zinc-800 rounded-xl overflow-hidden"
                >

                  <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 font-medium flex items-center justify-between">
                    <div>
                      {code.lang}
                    </div>

                    <button
                      onClick={() => {
                        setHideCodeOf((prev) => ({
                          ...prev,
                          [code.lang]: !prev[code.lang]
                        }));
                      }}
                      className="text-zinc-400 hover:text-white"
                    >
                      {hideCodeOf[code.lang] ? (
                        <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {!hideCodeOf[code.lang] && (
                    <div className="p-4">

                      <div className="mb-5 bg-black rounded-md">

                        <p className="text-zinc-400 px-3">
                          Starter Code
                        </p>

                        <Editor
                          theme="vs-dark"
                          height="100px"
                          language={code.lang}
                          value={code.starterCode}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                          }}
                        />

                      </div>

                      <div className="bg-black rounded-md">

                        <p className="text-zinc-400 px-3">
                          Runner Code
                        </p>

                        <Editor
                          theme="vs-dark"
                          height="300px"
                          language={code.lang}
                          value={code.solutionCode}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="border border-green-900 rounded-xl overflow-hidden">

                <div className="bg-green-950/20 border-b border-green-900 px-4 py-3 font-medium">
                  Correct Answer | {question.correctAnswer.language}
                </div>

                <Editor
                  theme="vs-dark"
                  height="300px"
                  language={question.correctAnswer?.language}
                  value={question.correctAnswer?.code}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                  }}
                />

              </div>

              {question.validationType === "custom" && (
                <div className="border border-yellow-800 rounded-xl overflow-hidden">

                  <div className="bg-yellow-950/20 border-b border-yellow-800 px-4 py-3 font-medium">
                    Validation Code
                  </div>

                  <Editor
                    theme="vs-dark"
                    height="300px"
                    language={question.validationCode?.language}
                    value={question.validationCode?.code}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      <div className="mt-8 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40">

        <div className="flex items-center justify-between">

          <button
            onClick={() => setShowTestCases(!showTestCases)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/40 transition"
          >
            <div className="flex items-center gap-3">

              {showTestCases ? (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              )}

              <h2 className="text-lg font-semibold">
                Test Cases
              </h2>

              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400">
                {question.testCases.length}
              </span>
              <span className="text-sm text-zinc-500">
                Click to {showTestCases ? "hide" : "view"}
              </span>

            </div>
          </button>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="bg-green-500 text-black hover:bg-green-700 cursor-pointer"
          >
            Add Test Case
          </Button>
        </div>




        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl">

              <div className="p-5 border-b border-zinc-800">

                <h2 className="text-xl font-semibold">
                  Add Test Cases
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  Input must be valid JSON.
                </p>

              </div>

              <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">

                <div className="rounded-xl bg-black p-4 text-sm">

                  {`Example:

                    {
                      "nums": [2,7,11,15],
                      "target": 9
                    }

                    Output:
                    [0,1]`}
                </div>

                {newCases.map((tc, index) => (
                  <div
                    key={index}
                    className="border border-zinc-800 rounded-xl p-4"
                  >

                    <div className="flex items-center justify-between mb-4">

                      <h3>
                        Test Case #{index + 1}
                      </h3>

                      {newCases.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setNewCases(prev =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          Remove
                        </Button>
                      )}

                    </div>

                    <textarea
                      value={tc.input}
                      onChange={(e) => {
                        const arr = [...newCases];
                        arr[index].input = e.target.value;
                        setNewCases(arr);
                      }}
                      className="w-full h-40 bg-black rounded-lg p-3 font-mono text-sm"
                      placeholder='{"nums":[1,2,3]}'
                    />

                    <textarea
                      value={tc.output}
                      onChange={(e) => {
                        const arr = [...newCases];
                        arr[index].output = e.target.value;
                        setNewCases(arr);
                      }}
                      className="w-full h-24 bg-black rounded-lg p-3 font-mono text-sm mt-3"
                      placeholder="[0,1]"
                    />

                    <label className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => {
                          const arr = [...newCases];
                          arr[index].isHidden = e.target.checked;
                          setNewCases(arr);
                        }}
                      />
                      Hidden testcase
                    </label>

                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => {
                    setNewCases(prev => [
                      ...prev,
                      {
                        input: "",
                        output: "",
                        isHidden: false
                      }
                    ]);
                  }}
                >
                  + Add Another
                </Button>

              </div>

              <div className="p-5 border-t border-zinc-800 flex justify-end gap-3">

                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  disabled={loading}
                  onClick={() => handleSubmit(question)}
                  className="bg-green-500 text-black hover:bg-green-700 cursor-pointer"
                >
                  Save Test Cases
                </Button>

              </div>

            </div>

          </div>
        )}

        {showTestCases && (
          <div className="border-t border-zinc-800">

            <div className="space-y-4 p-5">

              {question.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden"
                >

                  {/* HEADER */}

                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">

                    <div className="font-medium">
                      Test Case #{i + 1}
                    </div>

                    {tc.isHidden ? (
                      <div className="flex items-center gap-2 text-yellow-500 text-sm">
                        <EyeOff className="w-4 h-4" />
                        Hidden
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-500 text-sm">
                        <Eye className="w-4 h-4" />
                        Public
                      </div>
                    )}

                  </div>

                  {/* BODY */}

                  <div className="grid lg:grid-cols-2 gap-4 p-4">

                    <div>
                      <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                        Input
                      </div>

                      <pre className="bg-black rounded-lg p-4 overflow-auto text-sm text-zinc-300">
                        {typeof tc.input === "string"
                          ? tc.input
                          : JSON.stringify(tc.input, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                        Expected Output
                      </div>

                      <pre className="bg-black rounded-lg p-4 overflow-auto text-sm text-zinc-300">
                        {tc.output}
                      </pre>
                    </div>

                  </div>

                </div>
              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}