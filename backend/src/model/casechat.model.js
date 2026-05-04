import mongoose from "mongoose";

const caseChatSchema = new mongoose.Schema(
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
            ref: "Question",
            required: true,
        },
        sentBy:{
            type: String,
            enum: ["user","ai"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
    },{
        timestamps: true
    }
)

caseChatSchema.index({ createdAt: -1 })

const CaseChat = mongoose.model("CaseChat",caseChatSchema)

export default CaseChat