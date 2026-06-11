"use client";

import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  question: any;
  user: any;
  deleteQuestion: (id: string) => Promise<boolean>;
};

export default function SystemDesignQuestionCard({
  question,
  user,
  deleteQuestion,
}: Props) {
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/admin/questions/sys-des/${question._id}`);
  };

  const name = question?.addedBy?.name || "Unknown";
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  return (
    <div
      onClick={handleOpen}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 cursor-pointer hover:bg-zinc-900 transition"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
         
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-200">
              {initial}
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">{question.question}</h2>
              <span className="xs text-zinc-400">Creator: {name}</span>
              
            </div>
          </div>
        </div>

       {user?._id === question.addedBy._id && (
          <Button
            variant="destructive"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();

              if (
                confirm(
                  "Are you sure you want to delete this question? This action cannot be undone."
                )
              ) {
                deleteQuestion(question._id);
              }
            }}
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* DESCRIPTION */}
      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
        {question.description}
      </p>

      {/* META */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {question.difficulty}
        </span>

        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {question.duration} min
        </span>

        {/* {question.topics?.slice(0, 3).map((t: any) => (
          <span
            key={t}
            className="text-xs px-3 py-1 rounded-full bg-zinc-800"
          >
            {t}
          </span>
        ))} */}
      </div>
    </div>
  );
}