import mongoose from "mongoose";

const dsaChatSchema = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        interviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
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
        timestamps: true,
    }
)

dsaChatSchema.index({ createdAt: -1 });


const dsaChat = mongoose.model("DSAchat", dsaChatSchema);

export default dsaChat;