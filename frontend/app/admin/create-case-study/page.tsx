"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { useCaseStudyStore } from "@/store/useCaseStudy";
import { Button } from "@/components/ui/button";

export default function AdminCreateCaseStudyPage() {
  const router = useRouter();
  const { createCaseStudy, loading } = useCaseStudyStore();

  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    difficulity: "easy",
    duration: 30,
    domain: "",
    type: "",
    previousContext: "",
    goal: "",

    expectedApproach: [""],

    data: [],
    dataInput: { label: "", value: "" },

    sampleSolution: {
      answer: "",
      keyPoints: [""],
    },

    hints: [""],
    followUps: [""],
    constraints: [""],

    evaluation: [
      {
        category: "",
        description: "",
        weight: 1,
      },
    ],

    answerFormat: "structured",
  });

  const [errors, setErrors] = useState<any>({});

  const validate = (data: any) => {
    const newErrors: any = {
      evaluation: [],
    };
    let isValid = true;

    if (!data.title?.trim()) {
      newErrors.title = "Title required";
      isValid = false;
    }
    if (!data.description?.trim()) {
      newErrors.description = "Description required";
      isValid = false;
    }
    if (data.duration < 1) {
      newErrors.duration = "Duration must be at least 1 minute";
      isValid = false;
    }
    if (!data.domain?.trim()) {
      newErrors.domain = "Domain required";
      isValid = false;
    }
    if (!data.type?.trim()) {
      newErrors.type = "Type required";
      isValid = false;
    }
    if (!data.previousContext?.trim()) {
      newErrors.previousContext = "Previous context required";
      isValid = false;
    }
    if (!data.goal?.trim()) {
      newErrors.goal = "Goal required";
      isValid = false;
    }

    const validApproach = data.expectedApproach.filter((s: string) => s.trim());
    if (!validApproach.length) {
      newErrors.expectedApproach = "At least one approach step required";
      isValid = false;
    }

    if (!data.sampleSolution.answer?.trim()) {
      newErrors.solutionAnswer = "Sample solution answer required";
      isValid = false;
    }
    const validKeyPoints = data.sampleSolution.keyPoints.filter((k: string) => k.trim());
    if (!validKeyPoints.length) {
      newErrors.solutionKeyPoints = "At least one key point required";
      isValid = false;
    }

    if (!data.evaluation?.length) {
      newErrors.globalEval = "At least one evaluation required";
      isValid = false;
    } else {
      let total = 0;
      data.evaluation.forEach((e: any, i: number) => {
        const evalErr: any = {};
        if (!e.category?.trim()) { evalErr.category = "Category required"; isValid = false; }
        if (!e.description?.trim()) { evalErr.description = "Description required"; isValid = false; }
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
    const payload = {
      ...form,
      expectedApproach: form.expectedApproach.filter((s: string) => s.trim()),
      hints: form.hints.filter((h: string) => h.trim()),
      followUps: form.followUps.filter((f: string) => f.trim()),
      constraints: form.constraints.filter((c: string) => c.trim()),
      sampleSolution: {
        answer: form.sampleSolution.answer,
        keyPoints: form.sampleSolution.keyPoints.filter((k: string) => k.trim()),
      },
    };

    if (!validate(payload)) return;

    const ok = await createCaseStudy(payload);
    if (ok) router.back();
  };

  // ---- helpers ----
  const updateApproachStep = (i: number, val: string) => {
    const copy = [...form.expectedApproach];
    copy[i] = val;
    setForm({ ...form, expectedApproach: copy });
  };

  const removeApproachStep = (i: number) => {
    setForm({ ...form, expectedApproach: form.expectedApproach.filter((_: any, idx: number) => idx !== i) });
  };

  const updateKeyPoint = (i: number, val: string) => {
    const copy = [...form.sampleSolution.keyPoints];
    copy[i] = val;
    setForm({ ...form, sampleSolution: { ...form.sampleSolution, keyPoints: copy } });
  };

  const removeKeyPoint = (i: number) => {
    setForm({
      ...form,
      sampleSolution: {
        ...form.sampleSolution,
        keyPoints: form.sampleSolution.keyPoints.filter((_: any, idx: number) => idx !== i),
      },
    });
  };

  const addDataPoint = () => {
    const { label, value } = form.dataInput;
    if (!label.trim() || !value.trim()) return;
    setForm({
      ...form,
      data: [...form.data, { label, value }],
      dataInput: { label: "", value: "" },
    });
  };

  const removeDataPoint = (i: number) => {
    setForm({ ...form, data: form.data.filter((_: any, idx: number) => idx !== i) });
  };

  const addEvaluation = () => {
    setForm({
      ...form,
      evaluation: [...form.evaluation, { category: "", description: "", weight: 0 }],
    });
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
              <h1 className="text-3xl font-bold">Create Case Study</h1>
              <p className="text-sm text-zinc-400">Admin builder for case study questions</p>
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
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`w-full rounded-2xl bg-zinc-950 border ${errors.title ? "border-red-500" : "border-zinc-800"} p-4`}
            />
            {errors.title && <p className="text-red-500 text-sm mx-2">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`w-full min-h-[120px] rounded-2xl bg-zinc-950 border ${errors.description ? "border-red-500" : "border-zinc-800"} p-4`}
            />
            {errors.description && <p className="text-red-500 text-sm mx-2">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="mx-2 text-zinc-400 text-sm">Domain</p>
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
              >
                <option value="">Select Domain</option>
                <option value="consulting">Consulting</option>
                <option value="finance">Finance</option>
                <option value="product">Product</option>
                <option value="analytics">Analytics</option>
                <option value="general">General</option>
                <option value="sales">Sales</option>
                <option value="detective">Detective</option>
                <option value="medical">Medical</option>
              </select>
              {errors.domain && <p className="text-red-500 text-sm mx-2">{errors.domain}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <p className="mx-2 text-zinc-400 text-sm">Type</p>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
              >
                <option value="">Select Type</option>
                <option value="market_sizing">Market Sizing</option>
                <option value="profitability">Profitability</option>
                <option value="product">Product</option>
                <option value="strategy">Strategy</option>
                <option value="data">Data</option>
                <option value="persuasion">Persuasion</option>
                <option value="clue_finding">Clue Finding</option>
                <option value="diagnosis">Diagnosis</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm mx-2">{errors.type}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="mx-2 text-zinc-400 text-sm">Duration (minutes)</p>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className={`w-full rounded-2xl bg-zinc-950 border ${errors.duration ? "border-red-500" : "border-zinc-800"} p-4`}
              />
              {errors.duration && <p className="text-red-500 text-sm mx-2">{errors.duration}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <p className="mx-2 text-zinc-400 text-sm">Difficulty</p>
              <select
                value={form.difficulity}
                onChange={(e) => setForm({ ...form, difficulity: e.target.value })}
                className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="mx-2 text-zinc-400 text-sm">Answer format</p>
            <select
              value={form.answerFormat}
              onChange={(e) => setForm({ ...form, answerFormat: e.target.value })}
              className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4"
            >
              <option value="structured">Structured</option>
              <option value="freeform">Freeform</option>
              <option value="stepwise">Stepwise</option>
            </select>
          </div>
        </div>

        {/* CONTEXT & GOAL */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">
          <h2 className="font-semibold">Context & Goal</h2>

          <div className="flex flex-col gap-1">
            <textarea
              placeholder="Previous context — background the candidate needs to know"
              value={form.previousContext}
              onChange={(e) => setForm({ ...form, previousContext: e.target.value })}
              className={`w-full min-h-[120px] rounded-2xl bg-zinc-950 border ${errors.previousContext ? "border-red-500" : "border-zinc-800"} p-4`}
            />
            {errors.previousContext && <p className="text-red-500 text-sm mx-2">{errors.previousContext}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <textarea
              placeholder="Goal — what the candidate must accomplish"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className={`w-full min-h-[100px] rounded-2xl bg-zinc-950 border ${errors.goal ? "border-red-500" : "border-zinc-800"} p-4`}
            />
            {errors.goal && <p className="text-red-500 text-sm mx-2">{errors.goal}</p>}
          </div>

        </div>

        {/* EXPECTED APPROACH */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Expected Approach</h2>
            <button
              onClick={() => setForm({ ...form, expectedApproach: [...form.expectedApproach, ""] })}
              className="bg-white text-black px-3 rounded-xl text-sm"
            >
              Add Step
            </button>
          </div>

          {errors.expectedApproach && (
            <p className="text-red-400 text-sm mb-3">{errors.expectedApproach}</p>
          )}

          {form.expectedApproach.map((step: string, i: number) => (
            <div key={i} className="relative flex items-start gap-2 mb-3">
              <span className="mt-3 text-zinc-500 text-sm w-6 shrink-0">{i + 1}.</span>
              <input
                placeholder={`Step ${i + 1}`}
                value={step}
                onChange={(e) => updateApproachStep(i, e.target.value)}
                className="flex-1 p-3 rounded-xl bg-zinc-950 border border-zinc-800"
              />
              {form.expectedApproach.length > 1 && (
                <button
                  onClick={() => removeApproachStep(i)}
                  className="mt-2 p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 transition"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* DATA POINTS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">
          <h2 className="font-semibold">Data Points <span className="text-zinc-500 font-normal text-sm">(optional)</span></h2>

          <div className="flex gap-3">
            <input
              placeholder="Label (e.g. Revenue)"
              value={form.dataInput.label}
              onChange={(e) => setForm({ ...form, dataInput: { ...form.dataInput, label: e.target.value } })}
              className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
            />
            <input
              placeholder="Value (e.g. $4.2M)"
              value={form.dataInput.value}
              onChange={(e) => setForm({ ...form, dataInput: { ...form.dataInput, value: e.target.value } })}
              className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
            />
            <button
              onClick={addDataPoint}
              className="px-4 py-2 bg-white text-black rounded-xl text-sm font-medium"
            >
              Add
            </button>
          </div>

          {form.data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.data.map((d: any, i: number) => (
                <span
                  key={i}
                  className="bg-zinc-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-red-400 transition flex items-center gap-2"
                  onClick={() => removeDataPoint(i)}
                >
                  <span className="text-zinc-400">{d.label}:</span> {d.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SAMPLE SOLUTION */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-4">
          <h2 className="font-semibold">Sample Solution</h2>

          <div className="flex flex-col gap-1">
            <textarea
              placeholder="Model answer"
              value={form.sampleSolution.answer}
              onChange={(e) => setForm({ ...form, sampleSolution: { ...form.sampleSolution, answer: e.target.value } })}
              className={`w-full min-h-[140px] rounded-2xl bg-zinc-950 border ${errors.solutionAnswer ? "border-red-500" : "border-zinc-800"} p-4`}
            />
            {errors.solutionAnswer && <p className="text-red-500 text-sm mx-2">{errors.solutionAnswer}</p>}
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <p className="text-sm text-zinc-400">Key Points</p>
              <button
                onClick={() => setForm({ ...form, sampleSolution: { ...form.sampleSolution, keyPoints: [...form.sampleSolution.keyPoints, ""] } })}
                className="bg-white text-black px-3 py-1 rounded-xl text-sm"
              >
                Add Point
              </button>
            </div>

            {errors.solutionKeyPoints && <p className="text-red-400 text-sm mb-2">{errors.solutionKeyPoints}</p>}

            {form.sampleSolution.keyPoints.map((kp: string, i: number) => (
              <div key={i} className="relative flex items-center gap-2 mb-2">
                <span className="text-zinc-500 text-sm w-5 shrink-0">{i + 1}.</span>
                <input
                  placeholder={`Key point ${i + 1}`}
                  value={kp}
                  onChange={(e) => updateKeyPoint(i, e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                />
                {form.sampleSolution.keyPoints.length > 1 && (
                  <button
                    onClick={() => removeKeyPoint(i)}
                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 transition"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* EVALUATION */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Evaluation Criteria</h2>
            <button
              onClick={addEvaluation}
              className="bg-white text-black px-3 rounded-xl text-sm"
            >
              Add Evaluation
            </button>
          </div>

          {errors.globalEval && <div className="mb-3 text-red-400 text-sm">{errors.globalEval}</div>}
          {errors.global && <div className="mb-3 text-red-400 text-sm">{errors.global}</div>}

          {form.evaluation.map((e: any, i: number) => (
            <div
              key={i}
              className="relative grid gap-2 bg-zinc-950 p-6 rounded-2xl border border-zinc-800 mb-3"
            >
              <Button
                size="xs"
                className="absolute right-0 top-0 opacity-100 bg-red-500 transition rounded-tr-2xl cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setForm({ ...form, evaluation: form.evaluation.filter((_: any, idx: number) => idx !== i) });
                }}
              >
                <Trash2 className="h-2 w-2" />
              </Button>

              <input
                placeholder="Category (e.g. Problem Identification)"
                value={e.category}
                onChange={(ev) => {
                  const copy = [...form.evaluation];
                  copy[i].category = ev.target.value;
                  setForm({ ...form, evaluation: copy });
                }}
                className={`p-3 rounded-xl bg-zinc-900 border ${errors?.evaluation?.[i]?.category ? "border-red-500" : "border-zinc-800"}`}
              />
              {errors?.evaluation?.[i]?.category && (
                <p className="text-red-400 text-xs">{errors.evaluation[i].category}</p>
              )}

              <textarea
                placeholder="Description"
                value={e.description}
                onChange={(ev) => {
                  const copy = [...form.evaluation];
                  copy[i].description = ev.target.value;
                  setForm({ ...form, evaluation: copy });
                }}
                className={`p-3 rounded-xl bg-zinc-900 border ${errors?.evaluation?.[i]?.description ? "border-red-500" : "border-zinc-800"}`}
              />
              {errors?.evaluation?.[i]?.description && (
                <p className="text-red-400 text-xs">{errors.evaluation[i].description}</p>
              )}

              <div className="flex items-center gap-4">
                <p className="mx-2 text-zinc-400 text-sm">Weight</p>
                <input
                  type="number"
                  placeholder="Weight (0–1)"
                  value={e.weight}
                  onChange={(ev) => {
                    const copy = [...form.evaluation];
                    copy[i].weight = Number(ev.target.value);
                    setForm({ ...form, evaluation: copy });
                  }}
                  className={`p-3 flex-1 rounded-xl bg-zinc-900 border ${errors?.evaluation?.[i]?.weight ? "border-red-500" : "border-zinc-800"}`}
                />
              </div>
              {errors?.evaluation?.[i]?.weight && (
                <p className="text-red-400 text-xs">{errors.evaluation[i].weight}</p>
              )}
            </div>
          ))}
        </div>

        {/* HINTS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <textarea
            placeholder="Hints (one per line)"
            value={form.hints.join("\n")}
            onChange={(e) => setForm({ ...form, hints: e.target.value.split("\n") })}
            className="w-full min-h-[100px] p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
          />
        </div>

        {/* FOLLOW UPS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <textarea
            placeholder="Follow-up questions (one per line)"
            value={form.followUps.join("\n")}
            onChange={(e) => setForm({ ...form, followUps: e.target.value.split("\n") })}
            className="w-full min-h-[100px] p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
          />
        </div>

        {/* CONSTRAINTS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <textarea
            placeholder="Constraints (one per line)"
            value={form.constraints.join("\n")}
            onChange={(e) => setForm({ ...form, constraints: e.target.value.split("\n") })}
            className="w-full min-h-[100px] p-3 rounded-2xl bg-zinc-950 border border-zinc-800"
          />
        </div>


      </div>
    </div>
  );
}