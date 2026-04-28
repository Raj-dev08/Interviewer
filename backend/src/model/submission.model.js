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
        language: {
            type: String,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
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
        totalPoint: {//the metric to show how good is your marks
            type: Number,
            required: true,
        },
        percentageBeaten: {//for dsa we will use time * memory for it to give rough estimate so its global
            type: Number,
            required: true,
        },

    },{
        timestamps: true,
    }
)
submissionSchema.pre("validate", function (next) {
    if (this.questionType === "DSA") {
        if(!this.language){
            return next(new Error("Language is required for DSA questions"))
        }
        next()
    }
})

submissionSchema.index({ createdAt: -1 })
submissionSchema.index({ attemptNumber: -1})


const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;