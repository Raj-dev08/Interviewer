"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaseStudyStore } from "@/store/useCaseStudy";
import { useAuthStore } from "@/store/useAuth";

export default function CaseStudyAdminView() {
  const { id } = useParams();
  const router = useRouter();

  const { user, checkAuth } = useAuthStore();

  const {
    caseStudy,
    loading,
    fetchCaseStudy,
    deleteCaseStudy,
    clearCaseStudy,
  } = useCaseStudyStore();

  useEffect(() => {
    if (id) {
      fetchCaseStudy(id as string);

      if (!user) {
        checkAuth();
      }
    }

    return () => clearCaseStudy();
  }, [id]);

  if (loading && !caseStudy) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="p-10 text-zinc-400">
        Case Study Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">

          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-zinc-700 bg-zinc-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {caseStudy.addedBy?._id === user?._id && (
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                if (
                  confirm(
                    "Delete this case study permanently?"
                  )
                ) {
                  const ok = await deleteCaseStudy(
                    caseStudy._id
                  );

                  if (ok) {
                    router.push("/admin/content");
                  }
                }
              }}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {/* HERO */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">

          <div className="flex flex-col gap-5">

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-4xl font-bold">
                {caseStudy.title}
              </h1>

              <span className="px-3 py-1 rounded-full text-sm bg-zinc-800">
                {caseStudy.duration} min
              </span>

              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  caseStudy.difficulity === "easy"
                    ? "bg-green-500/20 text-green-400"
                    : caseStudy.difficulity === "medium"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {caseStudy.difficulity}
              </span>

              <span className="px-3 py-1 rounded-full text-sm bg-zinc-800">
                {caseStudy.domain}
              </span>

              <span className="px-3 py-1 rounded-full text-sm bg-zinc-800">
                {caseStudy.type}
              </span>

              <span className="px-3 py-1 rounded-full text-sm bg-zinc-800">
                {caseStudy.answerFormat}
              </span>

            </div>

            <p className="text-zinc-300 text-lg">
              {caseStudy.description}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">

              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold">
                {caseStudy.addedBy?.name?.[0]}
              </div>

              <div>
                <p className="text-sm text-zinc-400">
                  Created by
                </p>

                <p className="font-medium">
                  {caseStudy.addedBy?.name}
                </p>
              </div>

            </div>

          </div>

        </div>

        <Section title="Previous Context">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 whitespace-pre-wrap">
            {caseStudy.previousContext}
          </div>
        </Section>

        <Section title="Goal">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 whitespace-pre-wrap">
            {caseStudy.goal}
          </div>
        </Section>

        <Section title="Expected Approach">
          <div className="space-y-4">
            {caseStudy.expectedApproach?.map(
              (step: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                      {i + 1}
                    </div>

                    <p>{step}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </Section>

        <Section title="Data">
          <div className="grid md:grid-cols-2 gap-4">
            {caseStudy.data?.map((d: any, i: number) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <p className="text-sm text-zinc-500">
                  {d.label}
                </p>

                <p className="mt-2 font-semibold">
                  {d.value}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Sample Solution">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 whitespace-pre-wrap">
            {caseStudy.sampleSolution?.answer}
          </div>
        </Section>

        <Section title="Key Points">
          <div className="space-y-3">
            {caseStudy.sampleSolution?.keyPoints?.map(
              (point: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  {point}
                </div>
              )
            )}
          </div>
        </Section>

        <Section title="Evaluation Criteria">
          <div className="grid md:grid-cols-2 gap-4">
            {caseStudy.evaluation?.map(
              (e: any, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between">
                    <h3 className="font-semibold">
                      {e.category}
                    </h3>

                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">
                      {(e.weight * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-zinc-400 mt-3">
                    {e.description}
                  </p>
                </div>
              )
            )}
          </div>
        </Section>

        <Section title="Constraints">
          <div className="space-y-3">
            {caseStudy.constraints?.map(
              (c: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  {c}
                </div>
              )
            )}
          </div>
        </Section>

        <Section title="Hints">
          <div className="space-y-3">
            {caseStudy.hints?.map(
              (h: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  <span className="text-zinc-500 mr-2">
                    #{i + 1}
                  </span>

                  {h}
                </div>
              )
            )}
          </div>
        </Section>

        <Section title="Follow Ups">
          <div className="space-y-3">
            {caseStudy.followUps?.map(
              (f: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  {f}
                </div>
              )
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <h2 className="text-xl font-bold">
      {title}
    </h2>

    {children}
  </section>
);

