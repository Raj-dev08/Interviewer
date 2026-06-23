import CaseStudyInterview from "./CaseStudyInterview";

type Props = {
    interviewId: string;
    question: any;
};

export default function CaseStudySection({
    interviewId,
    question,
}: Props) {
    return (
        <div className="flex h-full flex-col md:flex-row">
            <div className="flex-1 overflow-y-auto p-6">
                {/* full case study question UI */}
            </div>

            <div className="md:w-[420px] border-l border-zinc-800">
                <CaseStudyInterview
                    interviewId={interviewId}
                    question={question}
                />
            </div>
        </div>
    );
}