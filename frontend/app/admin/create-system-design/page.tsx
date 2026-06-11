"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { useSystemDesignStore } from "@/store/useSysDes";
import { Button } from "@/components/ui/button";

export default function AdminCreateSystemDesignPage() {
  const router = useRouter();
  const { createQuestion, loading } = useSystemDesignStore();

  const [form, setForm] = useState<any>({
    question: "",
    description: "",
    difficulty: "easy",
    duration: 30,

    topics: [],
    topicInput: "",

    companyTags: [],
    companyInput: "",

    isPremium: false,

    constraints: "",
    hints: [""],
    followUp: [""],

    correctAnswerFlow: [
      {
        title: "",
        approach: "",
        step: 1,
      },
    ],

    evaluation: [
      {
        title: "",
        description: "",
        weight: 1,
        evalType: "boolean",
      },
    ],
  });

  const [errors, setErrors] = useState<any>({});


  const validate = (data: any) => {
    const newErrors: any = {
      flow: [],
      evaluation: [],
    };

    let isValid = true;

    if (!data.question?.trim()) {
      newErrors.question = "Question required";
      isValid = false;
    }

    if (!data.description?.trim()) {
      newErrors.description = "Description required";
      isValid = false;
    }

    if (data.duration < 1 ){
      newErrors.duration = "Duration must be at least 1 minute";
      isValid = false;
    }

    if (!data.constraints?.trim()) {
      newErrors.constraints = "Constraints required";
      isValid = false;
    }

    if (!["easy", "medium", "hard"].includes(data.difficulty)) {
      newErrors.difficulty = "Invalid difficulty";
      isValid = false;
    }

    // FLOW validation
    if (!data.correctAnswerFlow?.length) {
      newErrors.globalFlow = "At least one flow step required";
      isValid = false;
    } else {
      data.correctAnswerFlow.forEach((s: any, i: number) => {
        newErrors.flow[i] = {
          title: !s.title?.trim() ? "Title required" : "",
          approach: !s.approach?.trim() ? "Approach required" : "",
          step: !s.step ? "Step required" : "",
        };

        if (newErrors.flow[i].title || newErrors.flow[i].approach || newErrors.flow[i].step) {
          isValid = false;
        }
      });
    }

    // EVALUATION validation
    if (!data.evaluation?.length) {
      newErrors.globalEval = "At least one evaluation required";
      isValid = false;
    } else {
      let total = 0;

      data.evaluation.forEach((e: any, i: number) => {
        const evalErr: any = {};

        if (!e.title?.trim()) {
          evalErr.title = "Title required";
          isValid = false;
        }

        if (!e.description?.trim()) {
          evalErr.description = "Description required";
          isValid = false;
        }

        if (e.weight === undefined || e.weight < 0 || e.weight > 1) {
          evalErr.weight = "Must be 0–1";
          isValid = false;
        }

        total += Number(e.weight || 0);

        newErrors.evaluation[i] = evalErr;
      });

      if (Math.abs(total - 1) > 0.01) {
        newErrors.global = "Evaluation weights must sum to 1";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if(!validate(form)){
      return 
    }

    const ok = await createQuestion(form);
    if (ok) router.back();
  };

  const addFlowStep = () => {
    setForm((prev: any) => ({
      ...prev,
      correctAnswerFlow: [
        ...prev.correctAnswerFlow,
        {
          title: "",
          approach: "",
          step: prev.correctAnswerFlow.length + 1,
        },
      ],
    }));
  };

  const addEvaluation = () => {
    setForm((prev: any) => ({
      ...prev,
      evaluation: [
        ...prev.evaluation,
        {
          title: "",
          description: "",
          weight: 1,
          evalType: "boolean",
        },
      ],
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-bold">Create System Design</h1>
              <p className="text-sm text-zinc-400">
                Admin builder for system design questions
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-black font-semibold"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Create
          </button>
        </div>

        {/* BASIC */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <input
              placeholder="Question title"
              value={form.question}
              onChange={(e) =>
                setForm({ ...form, question: e.target.value })
              }
              className={`w-full rounded-2xl bg-zinc-950 border ${errors.question ? "border-red-500" : "border-zinc-800"} p-4`}
            />
            {errors.question && (
              <p className="text-red-500 text-sm mx-2">{errors.question}</p>
            )}
          </div>

          <div className="flex flex-col gap-1"> 
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={`w-full min-h-[140px] rounded-2xl bg-zinc-950 ${errors.description ? "border-red-500" : "border-zinc-950"} border p-4`}
            />

            {errors.description && (
              <p className="text-red-500 text-sm mx-2">{errors.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="mx-2 text-zinc-400 text-sm">Duration</p>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
              className={`w-full rounded-2xl bg-zinc-950 border ${
                errors.duration ? "border-red-500" : "border-zinc-800"
              } p-4`}
            />

            {errors.duration && (
              <p className="text-red-500 text-sm mx-2">{errors.duration}</p>
            )}
          </div>

          <select
            value={form.difficulty}
            onChange={(e) =>
              setForm({ ...form, difficulty: e.target.value })
            }
            className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {errors.difficulty && (
            <p className="text-red-500 text-sm mx-2">{errors.difficulty}</p>
          )}
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

        {/* ================= TOPICS ================= */}
        <div className="flex flex-col gap-3">
            <h3 className="text-sm text-zinc-400 font-semibold tracking-wide">
              TOPICS
            </h3>

            <input
              placeholder="Add topic (e.g. Database, Cache)"
              value={form.topicInput}
              onChange={(e) =>
                setForm({ ...form, topicInput: e.target.value })
              }
              className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
            />

            <button
              onClick={() => {
                if (!form.topicInput.trim()) return;

                setForm({
                  ...form,
                  topics: [
                    ...form.topics,
                    form.topicInput
                  ],
                  topicInput: "",
                });
              }}
              className="w-fit px-3 py-1 bg-white text-black rounded-xl text-sm"
            >
              Add Topic
            </button>


            <div className="flex gap-2 flex-wrap">

              {form.topics.map((t:string, i:number) => (
                <span
                  key={i}
                  className="bg-zinc-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-red-400 transition"
                  onClick={() => {
                    setForm({
                      ...form,
                      topics: form.topics.filter(
                        (tag:string) => tag !== t
                      ),
                    });
                  }}
                >
                  {t}
                </span>
              ))}

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
              setForm({
                ...form,
                companyInput: e.target.value,
              })
            }
            className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
          />

          <button
            onClick={() => {
              const value = form.companyInput.trim();

              if (!value) return;

              if (form.companyTags.includes(value)) return;

              setForm({
                ...form,
                companyTags: [
                  ...form.companyTags,
                  value,
                ],
                companyInput: "",
              });
            }}
            className="w-fit px-3 py-1 bg-white text-black rounded-xl text-sm"
          >
            Add Company
          </button>


          <div className="flex gap-2 flex-wrap">

            {form.companyTags.map((c:string, i:number) => (
              <span
                key={i}
                className="bg-zinc-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-red-400 transition"
                onClick={() => {
                  setForm({
                    ...form,
                    companyTags: form.companyTags.filter(
                      (tag:string) => tag !== c
                    ),
                  });
                }}
              >
                {c}
              </span>
            ))}

          </div>
        </div>

        {/* FLOW */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Correct Answer Flow</h2>
            <button
              onClick={addFlowStep}
              className="bg-white text-black px-3 rounded-xl"
            >
              Add Step
            </button>
          </div>

          {errors?.globalFlow && (
            <div className="mb-3 text-red-400 text-sm">{errors.globalFlow}</div>
          )}

          {form.correctAnswerFlow.map((s: any, i: number) => (
            <div
              key={i}
              className="grid relative gap-2 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 mb-3"
            >
              <Button size="xs" className="absolute right-0 top-0 opacity-100 bg-red-500 transition rounded-tr-2xl cursor-pointer "
                onClick={(e) => {
                  e.stopPropagation();
                  let copy = [...form.correctAnswerFlow];
                  copy = copy.filter((_, index) => index !== i);
                  setForm({ ...form, correctAnswerFlow: copy });
                }}
              >
                <Trash2 className="h-2 w-2" />
              </Button>

              <input
                placeholder="Title"
                value={s.title}
                onChange={(e) => {
                  const copy = [...form.correctAnswerFlow];
                  copy[i].title = e.target.value;
                  setForm({ ...form, correctAnswerFlow: copy });
                }}
                className={`p-3 rounded-xl bg-zinc-900 border ${
                  errors?.flow?.[i]?.title ? "border-red-500" : "border-zinc-800"
                }`}
              />
              {errors?.flow?.[i]?.title && (
                <p className="text-red-400 text-xs">{errors.flow[i].title}</p>
              )}

              <textarea
                placeholder="Approach"
                value={s.approach}
                onChange={(e) => {
                  const copy = [...form.correctAnswerFlow];
                  copy[i].approach = e.target.value;
                  setForm({ ...form, correctAnswerFlow: copy });
                }}
                className={`p-3 rounded-xl bg-zinc-900 border ${
                  errors?.flow?.[i]?.approach ? "border-red-500" : "border-zinc-800"
                }`}
              />
              {errors?.flow?.[i]?.approach && (
                <p className="text-red-400 text-xs">{errors.flow[i].approach}</p>
              )}

              <div className="flex items-center gap-4">
                <p className="mx-2 text-zinc-400 text-sm">Step</p>
                <input
                  type="number"
                  placeholder="Step"
                  value={s.step}
                  onChange={(e) => {
                    const copy = [...form.correctAnswerFlow];
                    copy[i].step = Number(e.target.value);
                    setForm({ ...form, correctAnswerFlow: copy });
                  }}
                  className={`p-3 rounded-xl bg-zinc-900 border flex-1 ${
                    errors?.flow?.[i]?.step ? "border-red-500" : "border-zinc-800"
                  }`}
                />
              </div>
              {errors?.flow?.[i]?.step && (
                <p className="text-red-400 text-xs">{errors.flow[i].step}</p>
              )}
            </div>
          ))}
        </div>

        {/* EVALUATION */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Evaluation Criteria</h2>
            <button
              onClick={addEvaluation}
              className="bg-white text-black px-3 rounded-xl"
            >
              Add Evalutaion
            </button>
          </div>

          {errors?.globalEval && (
            <div className="mb-3 text-red-400 text-sm">{errors.globalEval}</div>
          )}

          {form.evaluation.map((e: any, i: number) => (
            <div
              key={i}
              className="relative grid gap-2 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 mb-3"
            >
              <Button size="xs" className="absolute right-0 top-0 opacity-100 bg-red-500 transition rounded-tr-2xl cursor-pointer "
                onClick={(e) => {
                  e.stopPropagation();
                  let copy = [...form.evaluation];
                  copy = copy.filter((_, index) => index !== i);
                  setForm({ ...form, evaluation: copy });
                }}
              >
                <Trash2 className="h-2 w-2" />
              </Button>

              <input
                placeholder="Title"
                value={e.title}
                onChange={(ev) => {
                  const copy = [...form.evaluation];
                  copy[i].title = ev.target.value;
                  setForm({ ...form, evaluation: copy });
                }}
                className={`p-3 rounded-xl bg-zinc-900 border ${
                  errors?.evaluation?.[i]?.title ? "border-red-500" : "border-zinc-800"
                }`}
              />
              {errors?.evaluation?.[i]?.title && (
                <p className="text-red-400 text-xs">
                  {errors.evaluation[i].title}
                </p>
              )}

              <textarea
                placeholder="Description"
                value={e.description}
                onChange={(ev) => {
                  const copy = [...form.evaluation];
                  copy[i].description = ev.target.value;
                  setForm({ ...form, evaluation: copy });
                }}
                className={`p-3 rounded-xl bg-zinc-900 border ${
                  errors?.evaluation?.[i]?.description
                    ? "border-red-500"
                    : "border-zinc-800"
                }`}
              />
              {errors?.evaluation?.[i]?.description && (
                <p className="text-red-400 text-xs">
                  {errors.evaluation[i].description}
                </p>
              )}

              <div className="flex items-center gap-4">
                <p className="mx-2 text-zinc-400 text-sm">Weight</p>
                <input
                  type="number"
                  placeholder="Weight (0-1)"
                  value={e.weight}
                  onChange={(ev) => {
                    const copy = [...form.evaluation];
                    copy[i].weight = Number(ev.target.value);
                    setForm({ ...form, evaluation: copy });
                  }}
                  className={`p-3 flex-1 rounded-xl bg-zinc-900 border ${
                    errors?.evaluation?.[i]?.weight ? "border-red-500" : "border-zinc-800"
                  }`}
                />
              </div>
              {errors?.evaluation?.[i]?.weight && (
                <p className="text-red-400 text-xs">
                  {errors.evaluation[i].weight}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 mt-3 text-sm text-zinc-300">
                <div>
                  <h3 className="text-sm text-zinc-400 font-semibold">This evaluation should give approximate match</h3>
                  <p className="text-sm text-zinc-400 font-semibold">( if no then ai will strictly check if candidate followed it or not )</p>
                </div>
                <input
                  type="checkbox"
                  checked={e.evalType === "approx" ? true : false}
                  onChange={(e) => {
                    const copy = [...form.evaluation];
                    copy[i].evalType = form.evaluation[i].evalType === "boolean" ? "approx" : "boolean";
                    setForm({ ...form, evaluation: copy });
                  }}
                  className="w-4 h-4"
                />
              </div>
            </div>
          ))}
        </div>

        {/* CONSTRAINTS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex flex-col gap-1"> 
            <textarea
              placeholder="Constraints"
              value={form.constraints}
              onChange={(e) =>
                setForm({ ...form, constraints: e.target.value })
              }
              className={`w-full min-h-[120px] p-3 rounded-2xl bg-zinc-950 border ${errors.constraints ? "border-red-500" : "border-zinc-800"}`}
            />
            {errors.constraints && (
              <p className="text-red-500 text-sm mx-2">{errors.constraints}</p>
            )}
          </div>
        </div>


        {/* FOLLOW UP */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <textarea
            placeholder="Follow up questions (one per line)"
            value={form.followUp.join("\n")}
            onChange={(e) =>
              setForm({ ...form, followUp: e.target.value.split("\n") })
            }
            className="w-full min-h-[100px] p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
          />
        </div>

        {/* HINTS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <textarea
            placeholder="Hints (one per line)"
            value={form.hints.join("\n")}
            onChange={(e) =>
              setForm({ ...form, hints: e.target.value.split("\n") })
            }
            className="w-full min-h-[100px] p-3 rounded-2xl bg-zinc-950"
          />
        </div>

      </div>
    </div>
  );
}