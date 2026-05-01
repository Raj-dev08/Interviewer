import mongoose from "mongoose";

const sysdesFeedbackSchema = new mongoose.Schema(
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

const SysdesFeedback = mongoose.model("SysdesFeedback", sysdesFeedbackSchema);

export default SysdesFeedback;