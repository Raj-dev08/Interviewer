import mongoose from "mongoose";

const dsaFeedBackSchema = new mongoose.Schema(
    {
        interviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dsa",
            required: true
        },
         verdict: {
            type: String,
            enum: ["STRONG_HIRE", "HIRE", "BORDERLINE", "NO_HIRE"],
            required: true
        },

        summary: {
            type: String,
            required: true
        },

        scores: {
            problemSolving: { type: Number, min: 1, max: 10 },
            communication: { type: Number, min: 1, max: 10 },
            speed: { type: Number, min: 1, max: 10 },
            codeQuality: { type: Number, min: 1, max: 10 },
            correctness: { type: Number, min: 1, max: 10 }
        }

    },{
        timestamps: true
    }
)

const dsaFeedBack = mongoose.model("dsaFeedBack",dsaFeedBackSchema)

export default dsaFeedBack;