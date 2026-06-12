"use client";

import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  caseStudy: any;
  user: any;
  deleteCaseStudy: (id: string) => Promise<boolean>;
};

export default function CaseStudyCard({
  caseStudy,
  user,
  deleteCaseStudy,
}: Props) {
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/admin/questions/case-study/${caseStudy._id}`);
  };

  const name = caseStudy?.addedBy?.name || "Unknown";
  const initial = name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      onClick={handleOpen}
      className="
      rounded-2xl
      border border-zinc-800
      bg-zinc-900/50
      p-5
      cursor-pointer
      hover:bg-zinc-900
      transition
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="
            w-12 h-12
            rounded-full
            bg-zinc-800
            flex items-center justify-center
            text-sm font-semibold
            text-zinc-200
            "
          >
            {initial}
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {caseStudy.title}
            </h2>

            <span className="text-xs text-zinc-400">
              Creator: {name}
            </span>
          </div>
        </div>

        {user?._id === caseStudy?.addedBy?._id && (
          <Button
            variant="destructive"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();

              if (
                confirm(
                  "Are you sure you want to delete this case study?"
                )
              ) {
                deleteCaseStudy(caseStudy._id);
              }
            }}
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* DESCRIPTION */}
      <p className="mt-3 text-sm text-zinc-400 line-clamp-2">
        {caseStudy.description}
      </p>

      {/* META */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {caseStudy.difficulity}
        </span>

        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {caseStudy.duration} min
        </span>

        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {caseStudy.domain}
        </span>

        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {caseStudy.type}
        </span>

        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
          {caseStudy.answerFormat}
        </span>
      </div>
    </div>
  );
}

