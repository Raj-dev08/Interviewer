"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemDesignStore } from "@/store/useSysDes";
import { useAuthStore } from "@/store/useAuth";

export default function SystemDesignAdminView() {
  const { id } = useParams();
  const router = useRouter();

  const { user, checkAuth } = useAuthStore();

  const {
    question,
    loading,
    fetchQuestion,
    deleteQuestion,
    clearQuestion,
  } = useSystemDesignStore();

  useEffect(() => {
    if (id) {
      fetchQuestion(id as string);
      if (!user) checkAuth();
    }
    return () => clearQuestion();
  }, [id]);

  if (loading && !question) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!question) {
    return <div className="p-10 text-zinc-400">Not found</div>;
  }

//   console.log("Admin Question Page Rendered. Question data:", question);

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



      {/* HERO */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">

        <div className="flex flex-col gap-5">


          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-4xl font-bold">
              {question.question}
            </h1>


            <span className="
              px-3 py-1 rounded-full text-sm
              bg-zinc-800
            ">
              {question.duration} min
            </span>


            <span className={`
              px-3 py-1 rounded-full text-sm
              ${
                question.difficulty==="easy"
                ? "bg-green-500/20 text-green-400"
                : question.difficulty==="medium"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
              }
            `}>
              {question.difficulty}
            </span>

          </div>



          <p className="text-zinc-300 text-lg">
            {question.description}
          </p>



          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">

            <div className="
              w-10 h-10 rounded-full
              bg-zinc-800
              flex items-center justify-center
              font-bold
            ">
              {question.addedBy?.name?.[0]}
            </div>


            <div>
              <p className="text-sm text-zinc-400">
                Created by
              </p>

              <p className="font-medium">
                {question.addedBy?.name}
              </p>
            </div>

          </div>


        </div>

      </div>





      {/* TAGS */}
      <div className="flex flex-wrap gap-2">

        {question.topics?.map((t:string)=>(
          <span
            key={t}
            className="
            px-4 py-2 rounded-full
            bg-zinc-900
            border border-zinc-800
            text-sm
            "
          >
            {t}
          </span>
        ))}

      </div>





      {/* CONSTRAINTS */}
      <Section title="Constraints">

        <pre className="
          whitespace-pre-wrap
          bg-black
          border border-zinc-800
          rounded-2xl
          p-5
          text-zinc-300
        ">
          {question.constraints}
        </pre>

      </Section>





      {/* FLOW */}
      <Section title="Correct Answer Flow">

        <div className="space-y-4">

        {question.correctAnswerFlow?.map((s:any,i:number)=>(

          <div
            key={i}
            className="
            relative
            border border-zinc-800
            bg-zinc-900/60
            rounded-2xl
            p-5
            "
          >

            <div className="
              absolute -left-3 top-5
              w-7 h-7 rounded-full
              bg-white text-black
              flex items-center justify-center
              text-sm font-bold
            ">
              {s.step}
            </div>


            <h3 className="font-semibold text-lg ml-3">
              {s.title}
            </h3>


            <p className="text-zinc-300 mt-2 ml-3">
              {s.approach}
            </p>


          </div>

        ))}

        </div>

      </Section>





      {/* EVALUATION */}
      <Section title="Evaluation Criteria">

        <div className="grid md:grid-cols-2 gap-4">

        {question.evaluation?.map((e:any,i:number)=>(

          <div
            key={i}
            className="
            bg-zinc-900
            border border-zinc-800
            rounded-2xl
            p-5
            "
          >

            <div className="flex justify-between">

              <h3 className="font-semibold">
                {e.title}
              </h3>


              <span className="
              bg-blue-500/20
              text-blue-400
              px-3 py-1
              rounded-full
              text-xs
              ">
                {e.weight}
              </span>

            </div>


            <p className="text-zinc-400 mt-3">
              {e.description}
            </p>


            <p className="text-xs text-zinc-500 mt-3">
              Type: {e.evalType}
            </p>


          </div>

        ))}

        </div>

      </Section>






      {/* HINTS */}
      <Section title="Hints">

        <div className="space-y-3">

        {question.hints?.map((h: string, i: number) => {
            if (!h.trim()) return null;

            return (
                <div
                key={i}
                className="
                    bg-zinc-900
                    border border-zinc-800
                    rounded-xl
                    p-4
                "
                >
                <span className="text-zinc-500 mr-2">
                    #{i + 1}
                </span>

                {h}
                </div>
            );
            })}

        </div>

      </Section>





      {/* FOLLOW UPS */}
      <Section title="Follow Ups">

        <div className="space-y-3">

        {question.followUp?.map((f:string,i:number)=>(

          <div
            key={i}
            className="
            bg-zinc-900
            border border-zinc-800
            rounded-xl
            p-4
            "
          >
            {f}
          </div>

        ))}

        </div>

      </Section>


    </div>
  </div>
);
}

const Section = ({
  title,
  children
}:{
  title:string;
  children:React.ReactNode;
}) => (
  <section className="space-y-3">

    <h2 className="text-xl font-bold">
      {title}
    </h2>

    {children}

  </section>
);