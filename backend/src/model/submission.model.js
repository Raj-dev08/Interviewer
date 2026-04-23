import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
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
        questionType: {
            type: String,
            enum: ["DSA","CaseStudy","SystemDesign"],
            required: true,
        },
        difficulity: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
        },
        timeTaken: {
            type: Number,
            required: true,
        },
        isCorrect: {
            type: Boolean,
            required: true,
        },
        attemptNumber: {
            type: Number,
            required: true,
        },
    },{
        timestamps: true,
    }
)

submissionSchema.index({ createdAt: -1 })


const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;