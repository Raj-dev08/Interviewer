import mongoose from "mongoose";

const caseStudyFeedback = new mongoose.Schema(
    {
        interviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'questionType'
        },
        strength: {
            type: [String],
        },
        weakness: {
            type: [String],
        },
        improvement: {
            type: [String],
        },
    }
)

const CaseFeedback = mongoose.model("CaseFeedback", caseStudyFeedback);

export default CaseFeedback;