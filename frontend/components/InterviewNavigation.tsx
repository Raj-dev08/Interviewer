type Props = {
    interview: any;
    activeType: "sysDes" | "case" | "dsa";
    setActiveType: (
        type: "sysDes" | "case" | "dsa"
    ) => void;
    selectedQuestion: any;
    setSelectedQuestion: (question: {
        question: any;
        source: "sysDes" | "case" | "dsa";
    }) => void;
};

export default function InterviewNavigation({
    interview,
    activeType,
    setActiveType,
    selectedQuestion,
    setSelectedQuestion,
}: Props) {
    const tabs = [
        {
            key: "sysDes",
            label: "System Design",
        },
        {
            key: "case",
            label: "Case Study",
        },
        {
            key: "dsa",
            label: "DSA",
        },
    ];

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() =>
                            setActiveType(tab.key as any)
                        }
                        className={`rounded-xl px-4 py-2 text-sm ${activeType === tab.key
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-zinc-400"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {interview.questions[activeType].map(
                    (question: any, index: number) => (
                        <button
                            key={question._id}
                            onClick={() =>
                                setSelectedQuestion({
                                    question,
                                    source: activeType,
                                })
                            }
                            className={`rounded-xl px-4 py-2 text-sm ${selectedQuestion?.question?._id ===
                                question._id
                                ? "bg-blue-600 text-white"
                                : "bg-zinc-800 text-zinc-400"
                                }`}
                        >
                            Question {index + 1}
                        </button>
                    )
                )}
            </div>
        </div>
    );
}